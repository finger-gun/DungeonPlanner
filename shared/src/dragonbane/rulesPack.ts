import type { DragonbaneContentRef } from './contentRefs'

export type DragonbaneAttributeId = 'STR' | 'CON' | 'AGL' | 'INT' | 'WIL' | 'CHA'
export type DragonbaneAgeCategoryId = 'Young' | 'Middle-Aged' | 'Old'

export type DragonbaneSourceProvenance = {
  sourceRepository: string
  sourcePath: string
  sourceVersion?: string
  packVersion: string
  importedAt: string
  importer: 'dragonbane-unbound'
}

export type DragonbanePackVisibility = 'global' | 'public' | 'private'
export type DragonbanePackSystem = 'dragonbane'
export type DragonbanePackKind = 'rules'
export type DragonbanePackEntryKind = 'scene-asset' | 'rules-data'
export type DragonbanePackConnectorType = 'FLOOR' | 'WALL' | 'SURFACE'
export type DragonbanePackSnapsTo = 'GRID' | 'FREE'
export type DragonbaneSceneCategory = 'floor' | 'wall' | 'prop' | 'opening' | 'player'
export type DragonbaneAssetBrowserCategory =
  | 'furniture'
  | 'storage'
  | 'decor'
  | 'nature'
  | 'treasure'
  | 'structure'
  | 'openings'
  | 'surfaces'
export type DragonbaneAssetBrowserSubcategory =
  | 'tables'
  | 'seating'
  | 'beds'
  | 'shelving'
  | 'containers'
  | 'barrels'
  | 'lighting'
  | 'banners'
  | 'tabletop'
  | 'books'
  | 'trees'
  | 'bare-trees'
  | 'bushes'
  | 'grass'
  | 'rocks'
  | 'loot'
  | 'tools'
  | 'rubble'
  | 'pillars'
  | 'bars'
  | 'doors'
  | 'stairs'
  | 'floors'
  | 'walls'
  | 'misc'

export type DragonbanePackConnector = {
  point: number[]
  type: DragonbanePackConnectorType
  rotation?: number[]
}

export type DragonbanePackPlacement = {
  category?: DragonbaneSceneCategory
  snapsTo?: DragonbanePackSnapsTo
  connectors?: DragonbanePackConnector[]
  propSurface?: boolean
  blocksLineOfSight?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  wallSpan?: 1 | 2 | 3
  openingWidth?: 1 | 2 | 3
  stairDirection?: 'up' | 'down'
  pairedAssetRef?: string
  tileSpan?: {
    gridWidth: 1 | 2 | 4
    gridHeight: 1 | 2 | 4
  }
}

export type DragonbanePackBrowserMetadata = {
  category?: DragonbaneAssetBrowserCategory
  subcategory?: DragonbaneAssetBrowserSubcategory
  tags?: string[]
}

export type DragonbanePackLight = {
  color: string
  intensity: number
  distance: number
  decay?: number
  offset?: number[]
  flicker?: boolean
  castShadow?: boolean
}

export type DragonbanePackEffectEmitter = {
  offset?: number[]
  scale?: number
  intensity?: number
  color?: string
}

export type DragonbanePackEffect = {
  preset: 'fire'
  emitters?: DragonbanePackEffectEmitter[]
}

export type DragonbaneCanonicalPackEntry = {
  id: string
  localId: string
  name: string
  entryKind: DragonbanePackEntryKind
  category: string
  assetFileRef?: string
  thumbnailFileRef?: string
  placement?: DragonbanePackPlacement
  browser?: DragonbanePackBrowserMetadata
  light?: DragonbanePackLight
  effects?: DragonbanePackEffect[]
}

export type DragonbaneKin = {
  ref: DragonbaneContentRef
  id: string
  name: string
  movement: number
  /** True if this kin can be used for player characters. False = NPC/monster only. */
  playableByPlayers: boolean
  heroicAbilityRef?: DragonbaneContentRef
  source?: string
}

export type DragonbaneProfession = {
  ref: DragonbaneContentRef
  id: string
  name: string
  keyAttributeIds: DragonbaneAttributeId[]
  trainedSkillRefs: DragonbaneContentRef[]
  startingEquipment: DragonbaneStartingEquipment
  source?: string
}

export type DragonbaneSkill = {
  ref: DragonbaneContentRef
  id: string
  name: string
  attributeId: DragonbaneAttributeId
  isSecondary: boolean
  source?: string
}

export type DragonbaneStartingEquipment = {
  weaponRefs: DragonbaneContentRef[]
  armorRefs: DragonbaneContentRef[]
  itemRefs: DragonbaneContentRef[]
  copper: number
}

export type DragonbaneWeapon = {
  ref: DragonbaneContentRef
  id: string
  name: string
  grip?: string
  damage?: string
  durability?: number
  features: string[]
  source?: string
}

export type DragonbaneArmor = {
  ref: DragonbaneContentRef
  id: string
  name: string
  rating: number
  movementPenalty: number
  source?: string
}

export type DragonbaneCreationRules = {
  ref: DragonbaneContentRef
  id: 'character-creation'
  ageSkillSlots: Record<DragonbaneAgeCategoryId, DragonbaneAgeSkillSlots>
  damageBonusRanges: Partial<Record<DragonbaneAttributeId, DragonbaneDamageBonusRange[]>>
  movementAgilityModifiers: DragonbaneMovementAgilityModifier[]
}

export type DragonbaneAgeSkillSlots = {
  total: number
  fromProfession: number
  freeChoice: number
}

export type DragonbaneDamageBonusRange = {
  min: number
  max?: number
  bonus: string
}

export type DragonbaneMovementAgilityModifier = {
  min?: number
  max?: number
  modifier: number
}

export type DragonbaneRollTableOption = {
  ref: DragonbaneContentRef
  id: string
  name: string
  roll?: number
  description?: string
  source?: string
}

export type DragonbaneHeroicAbility = {
  ref: DragonbaneContentRef
  id: string
  name: string
  requirement?: string
  wpCost?: number
  description?: string
  source?: string
}

export type DragonbaneSpell = {
  ref: DragonbaneContentRef
  id: string
  name: string
  rank?: number
  requirement?: string
  description?: string
  source?: string
}

export type DragonbaneMagicSchool = {
  ref: DragonbaneContentRef
  id: string
  name: string
  linkedSkillRef?: DragonbaneContentRef
  cantrips: DragonbaneSpell[]
  spells: DragonbaneSpell[]
  source?: string
}

export type DragonbaneMagicRules = {
  schools: Array<{
    id: string
    name: string
  }>
  preparedSpellsRule?: string
  cantripsAlwaysPrepared?: boolean
  cantripCost?: string
  spellCost?: string
  powerLevels?: number[]
  metalRestriction?: string
  spellBookRule?: string
  learningRules?: {
    fromTeacher?: string
    fromSpellBook?: string
    cantrips?: string
    newSchool?: string
  }
}

export type DragonbaneRulesPackDomains = {
  dragonbane: {
    schemaVersion: 1
    kins: DragonbaneKin[]
    professions: DragonbaneProfession[]
    skills: DragonbaneSkill[]
    rules: {
      characterCreation: DragonbaneCreationRules
      appearanceOptions: DragonbaneRollTableOption[]
      mementoOptions: DragonbaneRollTableOption[]
      weaknesses: DragonbaneRollTableOption[]
      heroicAbilities: DragonbaneHeroicAbility[]
      magic: {
        rules: DragonbaneMagicRules
        schools: DragonbaneMagicSchool[]
      }
    }
    equipment: {
      weapons: DragonbaneWeapon[]
      armor: DragonbaneArmor[]
    }
  }
}

export type DragonbaneRulesPackPayload = {
  packId: string
  name: string
  system: DragonbanePackSystem
  kind: DragonbanePackKind
  version: string
  visibility: DragonbanePackVisibility
  description?: string
  isActive: boolean
  alwaysActive: boolean
  bundled: boolean
  entries: DragonbaneCanonicalPackEntry[]
  domains: DragonbaneRulesPackDomains
  sourceProvenance: DragonbaneSourceProvenance
}

export type DragonbaneBundledPackRegistryEntry = {
  packId: string
  name: string
  system: DragonbanePackSystem
  kind: DragonbanePackKind
  version: string
  description?: string
  alwaysActive: boolean
  bundled: boolean
  path: string
}

export type DragonbaneBundledPackRegistry = {
  packs: DragonbaneBundledPackRegistryEntry[]
}
