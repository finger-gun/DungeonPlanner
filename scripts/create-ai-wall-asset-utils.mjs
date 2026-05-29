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

export function deriveWallTextureNameFromFilename(filename, textureToken = null) {
  const withoutExtension = String(filename).replace(/\.[^.]+$/, '')
  const basename = (textureToken && withoutExtension.includes(textureToken)
    ? withoutExtension.slice(0, withoutExtension.indexOf(textureToken))
    : withoutExtension.replace(/-main_\d+_?$/gi, ' '))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return toTitleCase(basename || 'AI Wall Texture')
}

const WALL_COLORWAYS = [
  ['bone white', '#ddd6b8'],
  ['burnt orange', '#b65d2f'],
  ['charcoal black', '#252525'],
  ['cobalt blue', '#2d5faa'],
  ['crimson red', '#a73535'],
  ['deep violet', '#5f3f8d'],
  ['moss green', '#617544'],
  ['ochre yellow', '#c29a3b'],
  ['rust brown', '#7b4a32'],
  ['slate grey', '#6f7780'],
]

const WALL_BROWSER_TAG_RULES = [
  ['stone', /\b(stone|ashlar|granite|sandstone|limestone|basalt|marble|cobblestone|masonry|block)\b/i],
  ['wood', /\b(wood|plank|log|oak|bark|wainscot|lath|palisade|tudor)\b/i],
  ['metal', /\b(iron|metal|riveted|weld|brace|rivet)\b/i],
  ['plaster', /\b(plaster|adobe|daub|wallpaper|damask|fabric)\b/i],
  ['organic', /\b(coral|fungal|porous|moss|mycelium|slime|living|vine)\b/i],
  ['ice', /\b(ice|frost|glacier|translucent)\b/i],
  ['lava', /\b(magma|lava|volcanic|obsidian|fissure)\b/i],
  ['arcane', /\b(arcane|crystal|crystalline|rune|runic|bioluminescent|glowing)\b/i],
  ['ruined', /\b(ruined|eroded|cracked|crumbling|weathered|defaced)\b/i],
  ['noble', /\b(noble|palace|manor|marble|ornate|polished|decorative)\b/i],
  ['cave', /\b(cave|cavern|underdark|rock|strata|catacomb|crypt|ossuary)\b/i],
]

export function deriveWallStyleBrowserMetadata({ id, name }) {
  const normalizedId = String(id ?? '')
  const displayName = String(name ?? '').trim() || toTitleCase(normalizedId)
  const source = normalizedId.startsWith('generated-') ? 'generated' : 'built-in'
  const nameWithoutSequence = displayName.replace(/\s+\d{4,}$/u, '').trim()
  const withMatch = nameWithoutSequence.match(/^(.+?)\s+With\s+(.+)$/i)
  const family = (withMatch?.[1] ?? nameWithoutSequence).trim()
  const detailText = withMatch?.[2] ?? nameWithoutSequence
  const normalizedDetail = detailText.toLowerCase()
  const colorway = WALL_COLORWAYS.find(([label]) => normalizedDetail.includes(label)) ?? null
  const variant = colorway ? toTitleCase(colorway[0]) : undefined
  const tags = WALL_BROWSER_TAG_RULES
    .filter(([, pattern]) => pattern.test(`${family} ${detailText}`))
    .map(([tag]) => tag)

  return {
    family,
    ...(variant ? { variant } : {}),
    ...(colorway ? { colorway: toTitleCase(colorway[0]), swatchColor: colorway[1] } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    source,
  }
}

export function pairTextureDepthFilename(textureFile, options = {}) {
  const textureToken = options.textureToken
  const depthToken = options.depthToken

  if (textureToken && depthToken) {
    if (!textureFile.includes(textureToken)) {
      return null
    }
    return textureFile.replace(textureToken, depthToken)
  }

  const depthSuffix = options.depthSuffix
  if (depthSuffix) {
    return `${textureFile}${depthSuffix}`
  }

  const texturePrefix = options.texturePrefix ?? 'wall-texture-'
  const depthPrefix = options.depthPrefix ?? 'wall-depth-'
  return `${depthPrefix}${textureFile.slice(texturePrefix.length)}`
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

export function createHeightfieldAoMap(heightData, width, height, options = {}) {
  if (!heightData || heightData.length !== width * height) {
    throw new Error('Height data length must match width * height')
  }

  const directions = options.directions ?? 16
  const radii = options.radii ?? buildAoSampleRadii(width, height)
  const strength = options.strength ?? 3.6
  const heightScale = options.heightScale ?? 1
  const distanceBias = options.distanceBias ?? 0.018
  const minValue = options.minValue ?? 72
  const wrapX = options.wrapX ?? true
  const wrapY = options.wrapY ?? false
  const output = Buffer.alloc(heightData.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = sampleHeight01(heightData, width, height, x, y, wrapX, wrapY)
      let occlusion = 0
      let sampleCount = 0

      for (let directionIndex = 0; directionIndex < directions; directionIndex += 1) {
        const angle = (directionIndex / directions) * Math.PI * 2
        const dirX = Math.cos(angle)
        const dirY = Math.sin(angle)
        let horizon = 0

        for (const radius of radii) {
          const sampleX = x + Math.round(dirX * radius)
          const sampleY = y + Math.round(dirY * radius)
          const neighbor = sampleHeight01(heightData, width, height, sampleX, sampleY, wrapX, wrapY)
          const rise = (neighbor - center) * heightScale - radius * distanceBias
          horizon = Math.max(horizon, rise / Math.max(1, radius))
          sampleCount += 1
        }

        occlusion += Math.max(0, horizon)
      }

      const normalizedOcclusion = Math.min(1, (occlusion / Math.max(1, sampleCount)) * strength * directions)
      output[y * width + x] = clampByte(255 - normalizedOcclusion * (255 - minValue))
    }
  }

  return output
}

export function createPackedOrmHeightMap({ aoData, roughnessData, heightData, width, height }) {
  const texelCount = width * height
  if (
    !aoData || aoData.length !== texelCount
    || !roughnessData || roughnessData.length !== texelCount
    || !heightData || heightData.length !== texelCount
  ) {
    throw new Error('Packed ORMH map inputs must match width * height')
  }

  const output = Buffer.alloc(texelCount * 3)
  for (let index = 0; index < texelCount; index += 1) {
    const offset = index * 3
    output[offset] = aoData[index]
    output[offset + 1] = roughnessData[index]
    output[offset + 2] = heightData[index]
  }

  return output
}

function buildAoSampleRadii(width, height) {
  const maxRadius = Math.max(1, Math.floor(Math.min(width, height) / 18))
  const candidates = [1, 2, 4, 8, 12, 16, 24, 32]
  return candidates.filter((radius) => radius <= maxRadius || radius === 1)
}

function sampleHeight01(data, width, height, x, y, wrapX, wrapY) {
  const sampleX = wrapX ? wrapCoordinate(x, width) : clampCoordinate(x, width)
  const sampleY = wrapY ? wrapCoordinate(y, height) : clampCoordinate(y, height)
  return data[sampleY * width + sampleX] / 255
}

function wrapCoordinate(value, size) {
  return ((value % size) + size) % size
}

function clampCoordinate(value, size) {
  return Math.max(0, Math.min(size - 1, value))
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

export function buildAiWallStyleRecipe({
  id,
  name,
  browser = deriveWallStyleBrowserMetadata({ id, name }),
  textureFormat = 'png',
}) {
  const materialPath = `../../assets/materials/dungeon/wall-materials/${id}`
  const previewFile = textureFormat === 'ktx2' ? 'preview.webp' : 'wall_albedo.png'

  return {
    id,
    name,
    previewImagePath: `${materialPath}/${previewFile}`,
    browser,
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
  textureFormat = 'png',
  parallaxScale = 0.055,
  parallaxSteps = 10,
  parallaxInvert = false,
  bumpScale = 0.08,
  roughness = 0.86,
  aoMapIntensity = 0.65,
}) {
  const materialPath = `../../assets/materials/dungeon/wall-materials/${id}`
  const compressed = textureFormat === 'ktx2'

  return `import type { GeneratedWallStyleMaterialDefinition } from '../../wallStyleProfiles'

export const wallStyleMaterial: GeneratedWallStyleMaterialDefinition = {
  id: ${JSON.stringify(id)},
  albedoPath: ${JSON.stringify(`${materialPath}/wall_albedo.${compressed ? 'ktx2' : 'png'}`)},
  normalPath: ${JSON.stringify(`${materialPath}/wall_normal.${compressed ? 'ktx2' : 'png'}`)},
  ${compressed
    ? `packedOrmHeightPath: ${JSON.stringify(`${materialPath}/wall_ormh.ktx2`)},`
    : `aoPath: ${JSON.stringify(`${materialPath}/wall_ao.png`)},
  heightPath: ${JSON.stringify(`${materialPath}/wall_height.png`)},
  roughnessPath: ${JSON.stringify(`${materialPath}/wall_roughness.png`)},`}
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
    ${compressed ? 'flipV: true,' : ''}
  },
}
`
}

export function buildWallMaterialSetSource({
  id,
  name,
  textureFormat = 'png',
  parallaxScale = 0.055,
  parallaxSteps = 10,
  parallaxInvert = false,
  bumpScale = 0.08,
  roughness = 0.86,
  aoMapIntensity = 0.65,
}) {
  const materialPath = `../../../../assets/materials/dungeon/wall-materials/${id}`
  const compressed = textureFormat === 'ktx2'
  const previewFile = compressed ? 'preview.webp' : 'wall_albedo.png'

  return `import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(name)},
  previewImageUrl: new URL(${JSON.stringify(`${materialPath}/${previewFile}`)}, import.meta.url).href,
  textures: {
    albedoUrl: new URL(${JSON.stringify(`${materialPath}/wall_albedo.${compressed ? 'ktx2' : 'png'}`)}, import.meta.url).href,
    normalUrl: new URL(${JSON.stringify(`${materialPath}/wall_normal.${compressed ? 'ktx2' : 'png'}`)}, import.meta.url).href,
    ${compressed
      ? `packedOrmHeightUrl: new URL(${JSON.stringify(`${materialPath}/wall_ormh.ktx2`)}, import.meta.url).href,`
      : `aoUrl: new URL(${JSON.stringify(`${materialPath}/wall_ao.png`)}, import.meta.url).href,
    heightUrl: new URL(${JSON.stringify(`${materialPath}/wall_height.png`)}, import.meta.url).href,
    roughnessUrl: new URL(${JSON.stringify(`${materialPath}/wall_roughness.png`)}, import.meta.url).href,`}
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
    ${compressed ? 'flipV: true,' : ''}
  },
}
`
}

function roundNumber(value) {
  return Number.parseFloat(Number(value).toFixed(4))
}
