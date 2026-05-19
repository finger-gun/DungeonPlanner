export function slugifyWallAssetId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toTitleCase(value) {
  return String(value)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function extractPngTextChunks(buffer) {
  const chunks = {}
  const pngSignatureLength = 8
  let offset = pngSignatureLength

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > buffer.length) {
      break
    }

    if (type === 'tEXt') {
      const data = buffer.subarray(dataStart, dataEnd)
      const separator = data.indexOf(0)
      if (separator >= 0) {
        const key = data.subarray(0, separator).toString('utf8')
        const value = data.subarray(separator + 1).toString('utf8')
        chunks[key] = value
      }
    }

    offset = dataEnd + 4
    if (type === 'IEND') {
      break
    }
  }

  return chunks
}

export function extractComfyPositivePrompt(buffer) {
  const textChunks = extractPngTextChunks(buffer)
  const promptChunk = textChunks.prompt ?? textChunks.workflow
  if (!promptChunk) {
    return null
  }

  try {
    const graph = JSON.parse(promptChunk)
    const prompt = findPositivePromptInComfyGraph(graph)
    return prompt?.trim() || null
  } catch {
    return null
  }
}

export function deriveWallTextureNameFromPrompt(prompt) {
  if (!prompt) {
    return 'AI Wall Texture'
  }

  const clauses = String(prompt)
    .replace(/\\n/g, ' ')
    .split(',')
    .map((clause) => clause.trim())
    .filter(Boolean)
    .filter((clause) => !/(texture fills|no background|style is|seen from|orthographic|lighting|flat unlit)/i.test(clause))

  const cleaned = clauses
    .join(' ')
    .replace(/\ba texture for 3d asset\b/gi, '')
    .replace(/\bseamless 2d texture map of\b/gi, '')
    .replace(/\bseamless 2d texture map\b/gi, '')
    .replace(/\bseamless texture map of\b/gi, '')
    .replace(/\bflat surface\b/gi, '')
    .replace(/\bflat exterior\b/gi, 'exterior')
    .replace(/\bflat\b/gi, '')
    .replace(/\b(an?|the)\b/gi, '')
    .replace(/\bfantasy\b/gi, '')
    .replace(/\bbuilding\b/gi, '')
    .replace(/\bwalls?\b/gi, '')
    .replace(/\bin center\b/gi, '')
    .replace(/\bwith\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ').filter(Boolean).slice(0, 7)
  return toTitleCase(words.join(' ') || 'AI Wall Texture')
}

export function parseBooleanFlag(value, fallback = false) {
  if (value === undefined) {
    return fallback
  }

  if (typeof value === 'boolean') {
    return value
  }

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  throw new Error(`Expected a boolean value, got "${value}"`)
}

function findPositivePromptInComfyGraph(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : Object.values(graph ?? {})
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }

    const title = node._meta?.title ?? node.title ?? ''
    const text = node.inputs?.text ?? node.widgets_values?.[0]
    if (
      typeof text === 'string'
      && /positive prompt/i.test(title)
    ) {
      return text
    }
  }

  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }

    const text = node.inputs?.text ?? node.widgets_values?.[0]
    if (
      typeof text === 'string'
      && /texture|wall/i.test(text)
      && !/negative prompt|background, white background/i.test(text)
    ) {
      return text
    }
  }

  return null
}

export function buildAiWallStyleRecipe({ id, name }) {
  const materialPath = `../../assets/materials/dungeon/wall-materials/${id}`

  return {
    id,
    name,
    previewImagePath: `${materialPath}/wall_albedo.png`,
    structuralCore: {
      profile: 'thick-stone-core',
      material: id,
      render: {
        hiddenProfileSegmentIndices: [0, 1, 2],
      },
    },
    roomFace: {
      profile: 'ai-gothic-wall-face',
      material: id,
    },
    exteriorFace: {
      profile: 'ai-gothic-wall-face',
      material: id,
    },
    joinMode: 'cover-piece',
    curvatureLimits: {
      minInnerRadius: 1.2,
      maxTurnDegrees: 135,
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: [
        'core.opening_door_custom',
        'core.opening_door_wall_1',
        'dungeon.wall_wall_opening',
      ],
    },
  }
}

export function buildWallStyleMaterialSource({
  id,
  parallaxScale = 0.055,
  parallaxSteps = 10,
  parallaxInvert = false,
  bumpScale = 0.08,
  roughness = 0.86,
  aoMapIntensity = 0.65,
}) {
  const materialPath = `../../assets/materials/dungeon/wall-materials/${id}`

  return `import type { GeneratedWallStyleMaterialDefinition } from '../../wallStyleProfiles'

export const wallStyleMaterial: GeneratedWallStyleMaterialDefinition = {
  id: ${JSON.stringify(id)},
  albedoPath: ${JSON.stringify(`${materialPath}/wall_albedo.png`)},
  normalPath: ${JSON.stringify(`${materialPath}/wall_normal.png`)},
  aoPath: ${JSON.stringify(`${materialPath}/wall_ao.png`)},
  heightPath: ${JSON.stringify(`${materialPath}/wall_height.png`)},
  roughnessPath: ${JSON.stringify(`${materialPath}/wall_roughness.png`)},
  shading: {
    tintColor: '#ffffff',
    roughness: ${roundNumber(roughness)},
    metalness: 0,
    bumpScale: ${roundNumber(bumpScale)},
    parallaxScale: ${roundNumber(parallaxScale)},
    parallaxSteps: ${Math.round(parallaxSteps)},
    parallaxInvert: ${parallaxInvert ? 'true' : 'false'},
    aoMapIntensity: ${roundNumber(aoMapIntensity)},
    topSurfaceColor: '#262a31',
    topSurfaceRoughness: 0.82,
  },
  uv: {
    verticalMode: 'fit-height',
    verticalWrap: 'clamp',
  },
}
`
}

export function buildWallMaterialSetSource({
  id,
  name,
  parallaxScale = 0.055,
  parallaxSteps = 10,
  parallaxInvert = false,
  bumpScale = 0.08,
  roughness = 0.86,
  aoMapIntensity = 0.65,
}) {
  const materialPath = `../../../../assets/materials/dungeon/wall-materials/${id}`

  return `import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(name)},
  previewImageUrl: new URL(${JSON.stringify(`${materialPath}/wall_albedo.png`)}, import.meta.url).href,
  textures: {
    albedoUrl: new URL(${JSON.stringify(`${materialPath}/wall_albedo.png`)}, import.meta.url).href,
    normalUrl: new URL(${JSON.stringify(`${materialPath}/wall_normal.png`)}, import.meta.url).href,
    aoUrl: new URL(${JSON.stringify(`${materialPath}/wall_ao.png`)}, import.meta.url).href,
    heightUrl: new URL(${JSON.stringify(`${materialPath}/wall_height.png`)}, import.meta.url).href,
    roughnessUrl: new URL(${JSON.stringify(`${materialPath}/wall_roughness.png`)}, import.meta.url).href,
  },
  shading: {
    tintColor: '#ffffff',
    roughness: ${roundNumber(roughness)},
    metalness: 0,
    bumpScale: ${roundNumber(bumpScale)},
    parallaxScale: ${roundNumber(parallaxScale)},
    parallaxSteps: ${Math.round(parallaxSteps)},
    parallaxInvert: ${parallaxInvert ? 'true' : 'false'},
    aoMapIntensity: ${roundNumber(aoMapIntensity)},
    topSurfaceColor: '#262a31',
    topSurfaceRoughness: 0.82,
    topSurfaceMetalness: 0,
  },
  uv: {
    verticalMode: 'fit-height',
    verticalWrap: 'clamp',
  },
}
`
}

function roundNumber(value) {
  return Number.parseFloat(Number(value).toFixed(4))
}
