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
        throw new Error(await readOllamaError(imageResponse));
    }
    const payload = await imageResponse.json();
    const imageDataUrl = extractGeneratedImage(payload);
    if (!imageDataUrl) {
        throw new Error('Ollama returned a response without image data.');
    }
    return imageDataUrl;
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
async function readOllamaError(response) {
    try {
        const payload = await response.json();
        if (payload.error) {
            return payload.error;
        }
    }
    catch {
        // Ignore JSON parse failures and fall back to status text.
    }
    return `Ollama request failed with ${response.status} ${response.statusText}.`;
}
