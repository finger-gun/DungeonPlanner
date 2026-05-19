export const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
export const DEFAULT_OLLAMA_IMAGE_MODEL = process.env.OLLAMA_IMAGE_MODEL ?? 'x/z-image-turbo';
export class GeneratedCharacterRequestError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.name = 'GeneratedCharacterRequestError';
        this.status = status;
    }
}
export async function handleGeneratedCharacterImageRequest(body, config = {}) {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const defaultModel = config.defaultModel ?? DEFAULT_OLLAMA_IMAGE_MODEL;
    const model = typeof body?.model === 'string' && body.model.trim().length > 0
        ? body.model.trim()
        : defaultModel;
    if (!prompt) {
        throw new GeneratedCharacterRequestError(400, 'Prompt is required.');
    }
    const imageDataUrl = await generateCharacterImage({
        model,
        prompt,
        width: 768,
        height: 1024,
    }, config.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL);
    return { model, imageDataUrl };
}
export async function listGeneratedCharacterModels(config = {}) {
    const defaultModel = config.defaultModel ?? DEFAULT_OLLAMA_IMAGE_MODEL;
    const ollamaBaseUrl = config.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL;
    let response;
    try {
        response = await fetch(`${ollamaBaseUrl}/api/tags`);
    }
    catch {
        throw new Error(`Could not reach Ollama at ${ollamaBaseUrl}. Make sure Ollama is running and the ${defaultModel} model is available.`);
    }
    if (!response.ok) {
        throw new Error(await readOllamaError(response));
    }
    const payload = (await readOllamaPayloads(response)).payloads.at(-1);
    const installedModels = Array.isArray(payload?.models)
        ? payload.models
            .map((model) => normalizeModelName(model?.name))
            .filter((model) => Boolean(model))
        : [];
    return {
        defaultModel,
        models: dedupeModelNames([defaultModel, ...installedModels]),
    };
}
async function generateCharacterImage(body, ollamaBaseUrl) {
    const requestBody = {
        ...body,
        stream: false,
    };
    let imageResponse;
    try {
        imageResponse = await fetch(`${ollamaBaseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
    }
    catch {
        throw new Error(`Could not reach Ollama at ${ollamaBaseUrl}. Make sure Ollama is running and the ${body.model} model is available.`);
    }
    if (!imageResponse.ok) {
        throw new Error(await readOllamaError(imageResponse, body.model));
    }
    const { payloads, rawText } = await readOllamaPayloads(imageResponse);
    const imageDataUrl = extractGeneratedImageFromPayloads(payloads);
    if (!imageDataUrl) {
        throw new Error(buildMissingImagePayloadMessage(body.model, payloads, rawText));
    }
    return imageDataUrl;
}
function extractGeneratedImageFromPayloads(payloads) {
    for (let index = payloads.length - 1; index >= 0; index -= 1) {
        const image = extractGeneratedImage(payloads[index]);
        if (image) {
            return image;
        }
    }
    return null;
}
function extractGeneratedImage(payload) {
    if (typeof payload.image === 'string' && payload.image.length > 0) {
        return normalizeImageDataUrl(payload.image);
    }
    if (Array.isArray(payload.images) && typeof payload.images[0] === 'string') {
        return normalizeImageDataUrl(payload.images[0]);
    }
    if (typeof payload.response === 'string' && payload.response.trim().length > 0) {
        return normalizeImageDataUrl(payload.response.trim());
    }
    return null;
}
function normalizeImageDataUrl(value) {
    const trimmed = value.trim();
    return trimmed.startsWith('data:image/')
        ? trimmed
        : `data:image/png;base64,${trimmed}`;
}
async function readOllamaError(response, model = DEFAULT_OLLAMA_IMAGE_MODEL) {
    const { payloads, rawText } = await readOllamaPayloads(response);
    const errorMessage = payloads
        .map((payload) => (typeof payload.error === 'string' ? payload.error.trim() : ''))
        .find(Boolean);
    if (errorMessage) {
        return normalizeOllamaErrorMessage(errorMessage, model);
    }
    const plainTextError = sanitizePlainText(rawText);
    if (plainTextError) {
        return normalizeOllamaErrorMessage(plainTextError, model);
    }
    return `Ollama request failed with ${response.status} ${response.statusText}.`;
}
async function readOllamaPayloads(response) {
    const rawText = await response.text();
    return {
        payloads: parseOllamaPayloads(rawText),
        rawText,
    };
}
function parseOllamaPayloads(rawText) {
    const trimmedText = rawText.trim();
    if (!trimmedText) {
        return [];
    }
    try {
        const payload = JSON.parse(trimmedText);
        if (isOllamaPayload(payload)) {
            return [payload];
        }
    }
    catch {
        // Fall through and try newline-delimited JSON payloads.
    }
    const lines = trimmedText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0) {
        return [];
    }
    const payloads = [];
    for (const line of lines) {
        try {
            const payload = JSON.parse(line);
            if (!isOllamaPayload(payload)) {
                return [];
            }
            payloads.push(payload);
        }
        catch {
            return [];
        }
    }
    return payloads;
}
function buildMissingImagePayloadMessage(model, payloads, rawText) {
    const compatibilityMessage = buildOllamaCompatibilityMessage(model);
    if (payloads.some((payload) => payload.done === false && (typeof payload.total === 'number' || typeof payload.completed === 'number'))) {
        return compatibilityMessage;
    }
    const plainTextError = sanitizePlainText(rawText);
    if (plainTextError) {
        return normalizeOllamaErrorMessage(plainTextError, model);
    }
    return compatibilityMessage;
}
function normalizeOllamaErrorMessage(message, model = DEFAULT_OLLAMA_IMAGE_MODEL) {
    const trimmedMessage = message.trim();
    if (/unexpected end of json input/i.test(trimmedMessage)
        || /\/completion\b.*\beof\b/i.test(trimmedMessage)
        || /\beof\b/i.test(trimmedMessage)) {
        return buildOllamaCompatibilityMessage(model);
    }
    return trimmedMessage;
}
function buildOllamaCompatibilityMessage(model) {
    return `Reached Ollama, but it did not return a usable image payload for ${model}. Try updating Ollama or choosing another installed image model.`;
}
function isOllamaPayload(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function sanitizePlainText(value) {
    const trimmed = value.trim();
    if (!trimmed || /<\/?[a-z][\s\S]*>/i.test(trimmed)) {
        return null;
    }
    return trimmed;
}
function normalizeModelName(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function dedupeModelNames(models) {
    const seen = new Set();
    const unique = [];
    for (const model of models) {
        if (seen.has(model)) {
            continue;
        }
        seen.add(model);
        unique.push(model);
    }
    return unique;
}
