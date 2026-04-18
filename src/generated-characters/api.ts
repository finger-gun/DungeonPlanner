const GENERATED_CHARACTER_API_PATH = '/api/generated-characters/image'
const GENERATED_CHARACTER_ASSET_API_PATH = '/api/generated-characters/assets'
const GENERATED_CHARACTER_MODELS_API_PATH = '/api/generated-characters/models'
const UNAVAILABLE_MESSAGE =
  'Character generation is unavailable right now. In dev, start `npm run dev:full` (or `npm run server`) and make sure Ollama is running.'
const STORAGE_UNAVAILABLE_MESSAGE =
  'Generated character storage is unavailable right now. In dev, start `npm run dev:full` (or `npm run server`).'

type GeneratedCharacterImagePayload = {
  error?: string
  imageDataUrl?: string
  model?: string
}

type GeneratedCharacterAssetPayload = {
  error?: string
  storageId?: string
  originalImageUrl?: string
  processedImageUrl?: string
  thumbnailUrl?: string
}

type GeneratedCharacterModelsPayload = {
  error?: string
  models?: unknown
  defaultModel?: unknown
}

export async function requestGeneratedCharacterImage(
  prompt: string,
  options: {
    model?: string | null
    fetchImpl?: typeof fetch
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch
  const trimmedModel = typeof options.model === 'string' ? options.model.trim() : ''
  const response = await performRequest(
    GENERATED_CHARACTER_API_PATH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...(trimmedModel ? { model: trimmedModel } : {}),
      }),
    },
    fetchImpl,
    UNAVAILABLE_MESSAGE,
  )
  const { payload, rawText } = await readPayload<GeneratedCharacterImagePayload>(response)

  if (!response.ok) {
    throw new Error(resolveRequestError(response, payload, rawText))
  }

  if (!payload.imageDataUrl || !payload.model) {
    throw new Error('Character generation failed because the response was incomplete.')
  }

  return {
    imageDataUrl: payload.imageDataUrl,
    model: payload.model,
  }
}

export async function listGeneratedCharacterModels(fetchImpl: typeof fetch = fetch) {
  const response = await performRequest(
    GENERATED_CHARACTER_MODELS_API_PATH,
    {
      method: 'GET',
    },
    fetchImpl,
    UNAVAILABLE_MESSAGE,
  )
  const { payload, rawText } = await readPayload<GeneratedCharacterModelsPayload>(response)

  if (!response.ok) {
    throw new Error(resolveRequestError(response, payload, rawText))
  }

  const models = Array.isArray(payload.models)
    ? payload.models
      .map((model) => (typeof model === 'string' ? model.trim() : ''))
      .filter((model): model is string => model.length > 0)
    : []
  const defaultModel = typeof payload.defaultModel === 'string' && payload.defaultModel.trim()
    ? payload.defaultModel.trim()
    : null

  return {
    defaultModel,
    models: dedupeModelNames([
      ...(defaultModel ? [defaultModel] : []),
      ...models,
    ]),
  }
}

export async function saveGeneratedCharacterAssets(
  images: {
    originalImageDataUrl: string
    processedImageDataUrl: string
    thumbnailDataUrl: string
  },
  fetchImpl: typeof fetch = fetch,
) {
  const response = await performRequest(
    GENERATED_CHARACTER_ASSET_API_PATH,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(images),
    },
    fetchImpl,
    STORAGE_UNAVAILABLE_MESSAGE,
  )
  const { payload, rawText } = await readPayload<GeneratedCharacterAssetPayload>(response)

  if (!response.ok) {
    throw new Error(resolveRequestError(
      response,
      payload,
      rawText,
      STORAGE_UNAVAILABLE_MESSAGE,
      `Generated character storage failed with ${response.status} ${response.statusText}.`,
    ))
  }

  if (!payload.storageId || !payload.originalImageUrl || !payload.processedImageUrl || !payload.thumbnailUrl) {
    throw new Error('Generated character storage failed because the response was incomplete.')
  }

  return {
    storageId: payload.storageId,
    originalImageUrl: payload.originalImageUrl,
    processedImageUrl: payload.processedImageUrl,
    thumbnailUrl: payload.thumbnailUrl,
  }
}

export async function deleteGeneratedCharacterAssets(
  storageId: string,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await performRequest(
    `${GENERATED_CHARACTER_ASSET_API_PATH}/${encodeURIComponent(storageId)}`,
    {
      method: 'DELETE',
    },
    fetchImpl,
    STORAGE_UNAVAILABLE_MESSAGE,
  )
  const { payload, rawText } = await readPayload<{ error?: string }>(response)
  if (!response.ok) {
    throw new Error(resolveRequestError(
      response,
      payload,
      rawText,
      STORAGE_UNAVAILABLE_MESSAGE,
      `Generated character storage failed with ${response.status} ${response.statusText}.`,
    ))
  }
}

async function performRequest(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  unavailableMessage: string,
) {
  try {
    return await fetchImpl(url, init)
  } catch {
    throw new Error(unavailableMessage)
  }
}

async function readPayload<T extends { error?: string }>(response: Response) {
  const rawText = await response.text()

  if (!rawText.trim()) {
    return {
      payload: {} as T,
      rawText,
    }
  }

  try {
    return {
      payload: JSON.parse(rawText) as T,
      rawText,
    }
  } catch {
    return {
      payload: {} as T,
      rawText,
    }
  }
}

function resolveRequestError(
  response: Response,
  payload: { error?: string },
  rawText: string,
  unavailableMessage = UNAVAILABLE_MESSAGE,
  fallbackMessage = `Character generation failed with ${response.status} ${response.statusText}.`,
) {
  if (payload.error?.trim()) {
    return payload.error.trim()
  }

  const plainTextError = sanitizePlainText(rawText)
  if (plainTextError) {
    return plainTextError
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return unavailableMessage
  }

  return fallbackMessage
}

function sanitizePlainText(value: string) {
  const trimmed = value.trim()
  if (!trimmed || /<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return null
  }

  return trimmed
}

function dedupeModelNames(models: string[]) {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const model of models) {
    if (seen.has(model)) {
      continue
    }
    seen.add(model)
    unique.push(model)
  }

  return unique
}

export { STORAGE_UNAVAILABLE_MESSAGE, UNAVAILABLE_MESSAGE }
