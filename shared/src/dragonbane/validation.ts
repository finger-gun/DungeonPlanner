import {
  createDragonbaneContentRef,
  normalizeDragonbaneContentRef,
  normalizeDragonbaneLocalId,
  type DragonbaneContentRef,
  type DragonbaneContentRefDomain,
} from './contentRefs'
import type {
  DragonbaneAgeCategoryId,
  DragonbaneArmor,
  DragonbaneAttributeId,
  DragonbaneBundledPackRegistry,
  DragonbaneBundledPackRegistryEntry,
  DragonbaneCanonicalPackEntry,
  DragonbaneCreationRules,
  DragonbaneHeroicAbility,
  DragonbaneKin,
  DragonbaneMagicRules,
  DragonbaneMagicSchool,
  DragonbanePackEffect,
  DragonbaneProfession,
  DragonbaneRollTableOption,
  DragonbaneRulesPackPayload,
  DragonbaneRulesPackDomains,
  DragonbaneSkill,
  DragonbaneSpell,
  DragonbaneSourceProvenance,
  DragonbaneStartingEquipment,
  DragonbaneWeapon,
} from './rulesPack'

const ATTRIBUTE_IDS: readonly DragonbaneAttributeId[] = ['STR', 'CON', 'AGL', 'INT', 'WIL', 'CHA']
const AGE_CATEGORY_IDS: readonly DragonbaneAgeCategoryId[] = ['Young', 'Middle-Aged', 'Old']

export function normalizeDragonbaneRulesPackDomains(
  packId: string,
  input: unknown,
): DragonbaneRulesPackDomains {
  if (!isRecord(input) || !isRecord(input.dragonbane)) {
    throw new Error('Dragonbane rules packs require a dragonbane domain payload.')
  }

  const domain = input.dragonbane
  const rules = requireRecord(domain.rules, 'dragonbane.rules')
  const equipment = requireRecord(domain.equipment, 'dragonbane.equipment')

  return {
    dragonbane: {
      schemaVersion: 1,
      kins: requireArray(domain.kins, 'dragonbane.kins').map((kin) => normalizeKin(packId, kin)),
      professions: requireArray(domain.professions, 'dragonbane.professions').map((profession) =>
        normalizeProfession(packId, profession),
      ),
      skills: requireArray(domain.skills, 'dragonbane.skills').map((skill) => normalizeSkill(packId, skill)),
      rules: {
        characterCreation: normalizeCreationRules(packId, requireRecord(rules.characterCreation, 'characterCreation')),
        appearanceOptions: optionalArray(rules.appearanceOptions).map((option) =>
          normalizeRollTableOption(packId, option, 'appearance'),
        ),
        mementoOptions: optionalArray(rules.mementoOptions).map((option) =>
          normalizeRollTableOption(packId, option, 'memento'),
        ),
        weaknesses: optionalArray(rules.weaknesses).map((option) =>
          normalizeRollTableOption(packId, option, 'weakness'),
        ),
        heroicAbilities: optionalArray(rules.heroicAbilities).map((ability) =>
          normalizeHeroicAbility(packId, ability),
        ),
        magic: normalizeMagic(packId, rules.magic),
      },
      equipment: {
        weapons: requireArray(equipment.weapons, 'dragonbane.equipment.weapons').map((weapon) =>
          normalizeWeapon(packId, weapon),
        ),
        armor: requireArray(equipment.armor, 'dragonbane.equipment.armor').map((armor) => normalizeArmor(packId, armor)),
      },
    },
  }
}

export function validateDragonbaneRulesPackDomains(packId: string, input: unknown): DragonbaneRulesPackDomains {
  const normalized = normalizeDragonbaneRulesPackDomains(packId, input)
  validateUniqueRefs([
    ...normalized.dragonbane.kins,
    ...normalized.dragonbane.professions,
    ...normalized.dragonbane.skills,
    normalized.dragonbane.rules.characterCreation,
    ...normalized.dragonbane.rules.appearanceOptions,
    ...normalized.dragonbane.rules.mementoOptions,
    ...normalized.dragonbane.rules.weaknesses,
    ...normalized.dragonbane.rules.heroicAbilities,
    ...normalized.dragonbane.rules.magic.schools,
    ...normalized.dragonbane.rules.magic.schools.flatMap((school) => [...school.cantrips, ...school.spells]),
    ...normalized.dragonbane.equipment.weapons,
    ...normalized.dragonbane.equipment.armor,
  ])
  validateProfessionSkillRefs(normalized)
  validateKinHeroicAbilityRefs(normalized)
  validateMagicSchoolSkillRefs(normalized)
  return normalized
}

export function validateDragonbaneSourceProvenance(input: unknown): DragonbaneSourceProvenance {
  const provenance = requireRecord(input, 'sourceProvenance')
  const importedAt = requireString(provenance.importedAt, 'sourceProvenance.importedAt')

  if (Number.isNaN(Date.parse(importedAt))) {
    throw new Error('sourceProvenance.importedAt must be an ISO date string.')
  }

  if (provenance.importer !== 'dragonbane-unbound') {
    throw new Error('sourceProvenance.importer must be dragonbane-unbound.')
  }

  return {
    sourceRepository: requireString(provenance.sourceRepository, 'sourceProvenance.sourceRepository'),
    sourcePath: requireString(provenance.sourcePath, 'sourceProvenance.sourcePath'),
    sourceVersion: optionalString(provenance.sourceVersion),
    packVersion: requireString(provenance.packVersion, 'sourceProvenance.packVersion'),
    importedAt,
    importer: 'dragonbane-unbound',
  }
}

export function validateDragonbaneRulesPackManifest(input: unknown): DragonbaneRulesPackPayload {
  const manifest = requireRecord(input, 'pack')
  const packId = requireString(manifest.packId, 'pack.packId')

  if (manifest.system !== 'dragonbane') {
    throw new Error('pack.system must be dragonbane.')
  }

  if (manifest.kind !== 'rules') {
    throw new Error('pack.kind must be rules.')
  }

  return {
    packId,
    name: requireString(manifest.name, 'pack.name'),
    system: 'dragonbane',
    kind: 'rules',
    version: requireString(manifest.version, 'pack.version'),
    visibility: normalizeVisibility(manifest.visibility),
    description: optionalString(manifest.description),
    isActive: requireBoolean(manifest.isActive, 'pack.isActive'),
    alwaysActive: requireBoolean(manifest.alwaysActive, 'pack.alwaysActive'),
    bundled: requireBoolean(manifest.bundled, 'pack.bundled'),
    entries: requireArray(manifest.entries, 'pack.entries').map((entry) => normalizeCanonicalPackEntry(entry)),
    domains: validateDragonbaneRulesPackDomains(packId, manifest.domains),
    sourceProvenance: validateDragonbaneSourceProvenance(manifest.sourceProvenance),
  }
}

export function validateDragonbaneBundledPackRegistry(input: unknown): DragonbaneBundledPackRegistry {
  const registry = requireRecord(input, 'registry')
  return {
    packs: requireArray(registry.packs, 'registry.packs').map((entry) => normalizeBundledPackRegistryEntry(entry)),
  }
}

function normalizeKin(packId: string, input: unknown): DragonbaneKin {
  const record = requireRecord(input, 'kin')
  const id = normalizeRequiredLocalId(record.id, 'kin.id')

  return {
    ref: normalizeRef(record.ref, 'kin', packId, id),
    id,
    name: requireString(record.name, 'kin.name'),
    movement: requirePositiveNumber(record.movement, 'kin.movement'),
    playableByPlayers: requireBoolean(record.playableByPlayers ?? true, 'kin.playableByPlayers'),
    heroicAbilityRef: optionalRef(record.heroicAbilityRef, 'rule', packId),
    source: optionalString(record.source),
  }
}

function normalizeProfession(packId: string, input: unknown): DragonbaneProfession {
  const record = requireRecord(input, 'profession')
  const id = normalizeRequiredLocalId(record.id, 'profession.id')

  return {
    ref: normalizeRef(record.ref, 'profession', packId, id),
    id,
    name: requireString(record.name, 'profession.name'),
    keyAttributeIds: requireArray(record.keyAttributeIds, 'profession.keyAttributeIds').map((attributeId) =>
      normalizeAttributeId(attributeId, 'profession.keyAttributeIds'),
    ),
    trainedSkillRefs: requireArray(record.trainedSkillRefs, 'profession.trainedSkillRefs').map((ref) =>
      normalizeRef(ref, 'skill', packId),
    ),
    startingEquipment: normalizeStartingEquipment(packId, requireRecord(record.startingEquipment, 'startingEquipment')),
    source: optionalString(record.source),
  }
}

function normalizeSkill(packId: string, input: unknown): DragonbaneSkill {
  const record = requireRecord(input, 'skill')
  const id = normalizeRequiredLocalId(record.id, 'skill.id')

  return {
    ref: normalizeRef(record.ref, 'skill', packId, id),
    id,
    name: requireString(record.name, 'skill.name'),
    attributeId: normalizeAttributeId(record.attributeId, 'skill.attributeId'),
    isSecondary: Boolean(record.isSecondary),
    source: optionalString(record.source),
  }
}

function normalizeCreationRules(packId: string, record: Record<string, unknown>): DragonbaneCreationRules {
  const ageSkillSlots = requireRecord(record.ageSkillSlots, 'characterCreation.ageSkillSlots')

  return {
    ref: normalizeRef(record.ref, 'rule', packId, 'character-creation'),
    id: 'character-creation',
    ageSkillSlots: Object.fromEntries(
      AGE_CATEGORY_IDS.map((age) => {
        const ageRecord = requireRecord(ageSkillSlots[age], `characterCreation.ageSkillSlots.${age}`)
        return [
          age,
          {
            total: requireNonNegativeInteger(ageRecord.total, `${age}.total`),
            fromProfession: requireNonNegativeInteger(ageRecord.fromProfession, `${age}.fromProfession`),
            freeChoice: requireNonNegativeInteger(ageRecord.freeChoice, `${age}.freeChoice`),
          },
        ]
      }),
    ) as DragonbaneCreationRules['ageSkillSlots'],
    damageBonusRanges: normalizeDamageBonusRanges(record.damageBonusRanges),
    movementAgilityModifiers: requireArray(
      record.movementAgilityModifiers,
      'characterCreation.movementAgilityModifiers',
    ).map((modifier) => {
      const modifierRecord = requireRecord(modifier, 'movementAgilityModifier')
      return {
        min: optionalNumber(modifierRecord.min),
        max: optionalNumber(modifierRecord.max),
        modifier: requireNumber(modifierRecord.modifier, 'movementAgilityModifier.modifier'),
      }
    }),
  }
}

function normalizeRollTableOption(
  packId: string,
  input: unknown,
  kind: 'appearance' | 'memento' | 'weakness',
): DragonbaneRollTableOption {
  const record = requireRecord(input, kind)
  const id = normalizeRequiredLocalId(record.id ?? record.name ?? `${kind}-${record.roll ?? 'option'}`, `${kind}.id`)

  return {
    ref: normalizeRef(record.ref, 'rule', packId, `${kind}.${id}`),
    id,
    name: requireString(record.name, `${kind}.name`),
    roll: optionalNumber(record.roll),
    description: optionalString(record.description),
    source: optionalString(record.source),
  }
}

function normalizeHeroicAbility(packId: string, input: unknown): DragonbaneHeroicAbility {
  const record = requireRecord(input, 'heroicAbility')
  const id = normalizeRequiredLocalId(record.id ?? record.name, 'heroicAbility.id')

  return {
    ref: normalizeRef(record.ref, 'rule', packId, `heroic_ability.${id}`),
    id,
    name: requireString(record.name, 'heroicAbility.name'),
    requirement: optionalString(record.requirement),
    wpCost: optionalNumber(record.wpCost),
    description: optionalString(record.description),
    source: optionalString(record.source),
  }
}

function normalizeMagic(packId: string, input: unknown): { rules: DragonbaneMagicRules; schools: DragonbaneMagicSchool[] } {
  const record = isRecord(input) ? input : {}

  return {
    rules: normalizeMagicRules(record.rules),
    schools: optionalArray(record.schools).map((school) => normalizeMagicSchool(packId, school)),
  }
}

function normalizeMagicRules(input: unknown): DragonbaneMagicRules {
  const record = isRecord(input) ? input : {}

  return {
    schools: optionalArray(record.schools).map((school) => {
      const schoolRecord = requireRecord(school, 'magic.rules.schools[]')
      return {
        id: normalizeRequiredLocalId(schoolRecord.id ?? schoolRecord.name, 'magic.rules.school.id'),
        name: requireString(schoolRecord.name, 'magic.rules.school.name'),
      }
    }),
    preparedSpellsRule: optionalString(record.preparedSpellsRule),
    cantripsAlwaysPrepared: optionalBoolean(record.cantripsAlwaysPrepared),
    cantripCost: optionalString(record.cantripCost),
    spellCost: optionalString(record.spellCost),
    powerLevels: optionalArray(record.powerLevels).map((value) => requireNumber(value, 'magic.rules.powerLevels')),
    metalRestriction: optionalString(record.metalRestriction),
    spellBookRule: optionalString(record.spellBookRule),
    learningRules: isRecord(record.learningRules)
      ? {
          fromTeacher: optionalString(record.learningRules.fromTeacher),
          fromSpellBook: optionalString(record.learningRules.fromSpellBook),
          cantrips: optionalString(record.learningRules.cantrips),
          newSchool: optionalString(record.learningRules.newSchool),
        }
      : undefined,
  }
}

function normalizeMagicSchool(packId: string, input: unknown): DragonbaneMagicSchool {
  const record = requireRecord(input, 'magicSchool')
  const id = normalizeRequiredLocalId(record.id ?? record.name, 'magicSchool.id')

  return {
    ref: normalizeRef(record.ref, 'rule', packId, `magic_school.${id}`),
    id,
    name: requireString(record.name, 'magicSchool.name'),
    linkedSkillRef: optionalRef(record.linkedSkillRef, 'skill', packId),
    cantrips: optionalArray(record.cantrips).map((spell) => normalizeSpell(packId, spell, `${id}.cantrip`)),
    spells: optionalArray(record.spells).map((spell) => normalizeSpell(packId, spell, `${id}.spell`)),
    source: optionalString(record.source),
  }
}

function normalizeSpell(packId: string, input: unknown, fallbackPrefix: string): DragonbaneSpell {
  const record = requireRecord(input, 'spell')
  const id = normalizeRequiredLocalId(record.id ?? record.name, 'spell.id')

  return {
    ref: normalizeRef(record.ref, 'rule', packId, `${fallbackPrefix}.${id}`),
    id,
    name: requireString(record.name, 'spell.name'),
    rank: optionalNumber(record.rank),
    requirement: optionalString(record.requirement),
    description: optionalString(record.description),
    source: optionalString(record.source),
  }
}

function normalizeStartingEquipment(
  packId: string,
  record: Record<string, unknown>,
): DragonbaneStartingEquipment {
  return {
    weaponRefs: optionalArray(record.weaponRefs).map((ref) => normalizeRef(ref, 'weapon', packId)),
    armorRefs: optionalArray(record.armorRefs).map((ref) => normalizeRef(ref, 'armor', packId)),
    itemRefs: optionalArray(record.itemRefs).map((ref) => normalizeRef(ref, 'rule', packId)),
    copper: requireNonNegativeInteger(record.copper ?? 0, 'startingEquipment.copper'),
  }
}

function normalizeWeapon(packId: string, input: unknown): DragonbaneWeapon {
  const record = requireRecord(input, 'weapon')
  const id = normalizeRequiredLocalId(record.id, 'weapon.id')

  return {
    ref: normalizeRef(record.ref, 'weapon', packId, id),
    id,
    name: requireString(record.name, 'weapon.name'),
    grip: optionalString(record.grip),
    damage: optionalString(record.damage),
    durability: optionalNumber(record.durability),
    features: optionalArray(record.features).map((feature) => requireString(feature, 'weapon.features')),
    source: optionalString(record.source),
  }
}

function normalizeArmor(packId: string, input: unknown): DragonbaneArmor {
  const record = requireRecord(input, 'armor')
  const id = normalizeRequiredLocalId(record.id, 'armor.id')

  return {
    ref: normalizeRef(record.ref, 'armor', packId, id),
    id,
    name: requireString(record.name, 'armor.name'),
    rating: requireNonNegativeInteger(record.rating, 'armor.rating'),
    movementPenalty: requireNonNegativeInteger(record.movementPenalty ?? 0, 'armor.movementPenalty'),
    source: optionalString(record.source),
  }
}

function normalizeCanonicalPackEntry(input: unknown): DragonbaneCanonicalPackEntry {
  const entry = requireRecord(input, 'packEntry')
  const entryKind = requireString(entry.entryKind, 'packEntry.entryKind')

  if (entryKind !== 'scene-asset' && entryKind !== 'rules-data') {
    throw new Error('packEntry.entryKind must be scene-asset or rules-data.')
  }

  return {
    id: requireString(entry.id, 'packEntry.id'),
    localId: requireString(entry.localId, 'packEntry.localId'),
    name: requireString(entry.name, 'packEntry.name'),
    entryKind,
    category: requireString(entry.category, 'packEntry.category'),
    assetFileRef: optionalString(entry.assetFileRef),
    thumbnailFileRef: optionalString(entry.thumbnailFileRef),
    placement: entry.placement === undefined ? undefined : normalizePackPlacement(entry.placement),
    browser: entry.browser === undefined ? undefined : normalizePackBrowserMetadata(entry.browser),
    light: entry.light === undefined ? undefined : normalizePackLight(entry.light),
    effects: entry.effects === undefined ? undefined : requireArray(entry.effects, 'packEntry.effects').map((effect) =>
      normalizePackEffect(effect),
    ),
  }
}

function normalizePackPlacement(input: unknown): DragonbaneCanonicalPackEntry['placement'] {
  const placement = requireRecord(input, 'packEntry.placement')
  return {
    category: normalizeOptionalSceneCategory(placement.category),
    snapsTo: normalizeOptionalSnapsTo(placement.snapsTo),
    connectors: placement.connectors === undefined
      ? undefined
      : requireArray(placement.connectors, 'packEntry.placement.connectors').map((connector) =>
          normalizePackConnector(connector),
        ),
    propSurface: optionalBoolean(placement.propSurface),
    blocksLineOfSight: optionalBoolean(placement.blocksLineOfSight),
    castShadow: optionalBoolean(placement.castShadow),
    receiveShadow: optionalBoolean(placement.receiveShadow),
    wallSpan: normalizeOptionalSizedNumber(placement.wallSpan, 'packEntry.placement.wallSpan', [1, 2, 3] as const),
    openingWidth: normalizeOptionalSizedNumber(
      placement.openingWidth,
      'packEntry.placement.openingWidth',
      [1, 2, 3] as const,
    ),
    stairDirection: normalizeOptionalDirection(placement.stairDirection),
    pairedAssetRef: optionalString(placement.pairedAssetRef),
    tileSpan: placement.tileSpan === undefined ? undefined : normalizeTileSpan(placement.tileSpan),
  }
}

function normalizePackConnector(input: unknown): NonNullable<NonNullable<DragonbaneCanonicalPackEntry['placement']>['connectors']>[number] {
  const connector = requireRecord(input, 'packEntry.connector')
  const type = requireString(connector.type, 'packEntry.connector.type')

  if (type !== 'FLOOR' && type !== 'WALL' && type !== 'SURFACE') {
    throw new Error('packEntry.connector.type must be FLOOR, WALL, or SURFACE.')
  }

  return {
    point: requireNumberArray(connector.point, 'packEntry.connector.point'),
    type,
    rotation: connector.rotation === undefined ? undefined : requireNumberArray(connector.rotation, 'packEntry.connector.rotation'),
  }
}

function normalizeTileSpan(input: unknown): NonNullable<NonNullable<DragonbaneCanonicalPackEntry['placement']>['tileSpan']> {
  const tileSpan = requireRecord(input, 'packEntry.placement.tileSpan')
  return {
    gridWidth: normalizeOptionalSizedNumber(tileSpan.gridWidth, 'packEntry.placement.tileSpan.gridWidth', [1, 2, 4] as const) ?? 1,
    gridHeight: normalizeOptionalSizedNumber(tileSpan.gridHeight, 'packEntry.placement.tileSpan.gridHeight', [1, 2, 4] as const) ?? 1,
  }
}

function normalizePackBrowserMetadata(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['browser']> {
  const browser = requireRecord(input, 'packEntry.browser')
  return {
    category: normalizeOptionalBrowserCategory(browser.category),
    subcategory: normalizeOptionalBrowserSubcategory(browser.subcategory),
    tags: browser.tags === undefined ? undefined : requireArray(browser.tags, 'packEntry.browser.tags').map((tag) =>
      requireString(tag, 'packEntry.browser.tags[]'),
    ),
  }
}

function normalizePackLight(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['light']> {
  const light = requireRecord(input, 'packEntry.light')
  return {
    color: requireString(light.color, 'packEntry.light.color'),
    intensity: requireNumber(light.intensity, 'packEntry.light.intensity'),
    distance: requireNumber(light.distance, 'packEntry.light.distance'),
    decay: optionalNumber(light.decay),
    offset: light.offset === undefined ? undefined : requireNumberArray(light.offset, 'packEntry.light.offset'),
    flicker: optionalBoolean(light.flicker),
    castShadow: optionalBoolean(light.castShadow),
  }
}

function normalizePackEffect(input: unknown): DragonbanePackEffect {
  const effect = requireRecord(input, 'packEntry.effect')

  if (effect.preset !== 'fire') {
    throw new Error('packEntry.effect.preset must be fire.')
  }

  return {
    preset: 'fire',
    emitters: effect.emitters === undefined
      ? undefined
      : requireArray(effect.emitters, 'packEntry.effect.emitters').map((emitter) => {
          const record = requireRecord(emitter, 'packEntry.effect.emitter')
          return {
            offset: record.offset === undefined ? undefined : requireNumberArray(record.offset, 'packEntry.effect.emitter.offset'),
            scale: optionalNumber(record.scale),
            intensity: optionalNumber(record.intensity),
            color: optionalString(record.color),
          }
        }),
  }
}

function normalizeBundledPackRegistryEntry(input: unknown): DragonbaneBundledPackRegistryEntry {
  const entry = requireRecord(input, 'registry.pack')

  if (entry.system !== 'dragonbane') {
    throw new Error('registry.pack.system must be dragonbane.')
  }

  if (entry.kind !== 'rules') {
    throw new Error('registry.pack.kind must be rules.')
  }

  return {
    packId: requireString(entry.packId, 'registry.pack.packId'),
    name: requireString(entry.name, 'registry.pack.name'),
    system: 'dragonbane',
    kind: 'rules',
    version: requireString(entry.version, 'registry.pack.version'),
    description: optionalString(entry.description),
    alwaysActive: requireBoolean(entry.alwaysActive, 'registry.pack.alwaysActive'),
    bundled: requireBoolean(entry.bundled, 'registry.pack.bundled'),
    path: requireString(entry.path, 'registry.pack.path'),
  }
}

function normalizeDamageBonusRanges(input: unknown): DragonbaneCreationRules['damageBonusRanges'] {
  const record = requireRecord(input, 'characterCreation.damageBonusRanges')
  const ranges: DragonbaneCreationRules['damageBonusRanges'] = {}

  for (const attributeId of ATTRIBUTE_IDS) {
    if (record[attributeId] === undefined) {
      continue
    }

    ranges[attributeId] = requireArray(record[attributeId], `damageBonusRanges.${attributeId}`).map((range) => {
      const rangeRecord = requireRecord(range, 'damageBonusRange')
      return {
        min: requireNumber(rangeRecord.min, 'damageBonusRange.min'),
        max: optionalNumber(rangeRecord.max),
        bonus: requireString(rangeRecord.bonus, 'damageBonusRange.bonus'),
      }
    })
  }

  return ranges
}

function validateUniqueRefs(items: Array<{ ref: DragonbaneContentRef }>) {
  const refs = new Set<string>()

  for (const item of items) {
    if (refs.has(item.ref)) {
      throw new Error(`Duplicate Dragonbane content ref: ${item.ref}`)
    }
    refs.add(item.ref)
  }
}

function validateProfessionSkillRefs(domains: DragonbaneRulesPackDomains) {
  const skillRefs = new Set(domains.dragonbane.skills.map((skill) => skill.ref))

  for (const profession of domains.dragonbane.professions) {
    for (const ref of profession.trainedSkillRefs) {
      if (!skillRefs.has(ref)) {
        throw new Error(`Profession ${profession.ref} references unknown skill ${ref}.`)
      }
    }
  }
}

function validateKinHeroicAbilityRefs(domains: DragonbaneRulesPackDomains) {
  const heroicAbilityRefs = new Set(domains.dragonbane.rules.heroicAbilities.map((ability) => ability.ref))

  for (const kin of domains.dragonbane.kins) {
    if (kin.heroicAbilityRef && !heroicAbilityRefs.has(kin.heroicAbilityRef)) {
      throw new Error(`Kin ${kin.ref} references unknown heroic ability ${kin.heroicAbilityRef}.`)
    }
  }
}

function validateMagicSchoolSkillRefs(domains: DragonbaneRulesPackDomains) {
  const skillRefs = new Set(domains.dragonbane.skills.map((skill) => skill.ref))

  for (const school of domains.dragonbane.rules.magic.schools) {
    if (school.linkedSkillRef && !skillRefs.has(school.linkedSkillRef)) {
      throw new Error(`Magic school ${school.ref} references unknown skill ${school.linkedSkillRef}.`)
    }
  }
}

function normalizeRef(
  input: unknown,
  domain: DragonbaneContentRefDomain,
  packId: string,
  fallbackLocalId?: string,
): DragonbaneContentRef {
  if (typeof input === 'string') {
    const normalized = normalizeDragonbaneContentRef(input, domain, packId)
    if (normalized) {
      return normalized
    }
  }

  if (fallbackLocalId) {
    return createDragonbaneContentRef(packId, domain, fallbackLocalId)
  }

  throw new Error(`Expected a ${domain} content ref.`)
}

function optionalRef(
  input: unknown,
  domain: DragonbaneContentRefDomain,
  packId: string,
): DragonbaneContentRef | undefined {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  return normalizeRef(input, domain, packId)
}

function normalizeRequiredLocalId(input: unknown, field: string) {
  const value = normalizeDragonbaneLocalId(requireString(input, field))
  if (!value) {
    throw new Error(`${field} is required.`)
  }
  return value
}

function normalizeAttributeId(input: unknown, field: string): DragonbaneAttributeId {
  const attributeId = requireString(input, field).toUpperCase()

  if (!ATTRIBUTE_IDS.includes(attributeId as DragonbaneAttributeId)) {
    throw new Error(`${field} must be a Dragonbane attribute id.`)
  }

  return attributeId as DragonbaneAttributeId
}

function requireRecord(input: unknown, field: string): Record<string, unknown> {
  if (!isRecord(input)) {
    throw new Error(`${field} must be an object.`)
  }
  return input
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

function requireArray(input: unknown, field: string): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error(`${field} must be an array.`)
  }
  return input
}

function optionalArray(input: unknown): unknown[] {
  return input === undefined || input === null ? [] : requireArray(input, 'optional array')
}

function requireString(input: unknown, field: string) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error(`${field} must be a non-empty string.`)
  }
  return input.trim()
}

function optionalString(input: unknown) {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined
}

function normalizeVisibility(input: unknown): DragonbaneRulesPackPayload['visibility'] {
  const visibility = requireString(input, 'pack.visibility')

  if (visibility !== 'global' && visibility !== 'public' && visibility !== 'private') {
    throw new Error('pack.visibility must be global, public, or private.')
  }

  return visibility
}

function requireNumber(input: unknown, field: string) {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    throw new Error(`${field} must be a number.`)
  }
  return input
}

function optionalNumber(input: unknown) {
  return typeof input === 'number' && Number.isFinite(input) ? input : undefined
}

function requireBoolean(input: unknown, field: string) {
  if (typeof input !== 'boolean') {
    throw new Error(`${field} must be a boolean.`)
  }
  return input
}

function optionalBoolean(input: unknown) {
  return typeof input === 'boolean' ? input : undefined
}

function requireNumberArray(input: unknown, field: string) {
  return requireArray(input, field).map((value) => requireNumber(value, field))
}

function normalizeOptionalSnapsTo(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['placement']>['snapsTo'] {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const snapsTo = requireString(input, 'packEntry.placement.snapsTo')
  if (snapsTo !== 'GRID' && snapsTo !== 'FREE') {
    throw new Error('packEntry.placement.snapsTo must be GRID or FREE.')
  }
  return snapsTo
}

function normalizeOptionalDirection(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['placement']>['stairDirection'] {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const direction = requireString(input, 'packEntry.placement.stairDirection')
  if (direction !== 'up' && direction !== 'down') {
    throw new Error('packEntry.placement.stairDirection must be up or down.')
  }
  return direction
}

function normalizeOptionalSceneCategory(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['placement']>['category'] {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const category = requireString(input, 'packEntry.placement.category')
  if (!['floor', 'wall', 'prop', 'opening', 'player'].includes(category)) {
    throw new Error('packEntry.placement.category must be floor, wall, prop, opening, or player.')
  }
  return category as NonNullable<DragonbaneCanonicalPackEntry['placement']>['category']
}

function normalizeOptionalBrowserCategory(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['browser']>['category'] {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const category = requireString(input, 'packEntry.browser.category')
  if (!['furniture', 'storage', 'decor', 'nature', 'treasure', 'structure', 'openings', 'surfaces'].includes(category)) {
    throw new Error('packEntry.browser.category is invalid.')
  }
  return category as NonNullable<DragonbaneCanonicalPackEntry['browser']>['category']
}

function normalizeOptionalBrowserSubcategory(input: unknown): NonNullable<DragonbaneCanonicalPackEntry['browser']>['subcategory'] {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const subcategory = requireString(input, 'packEntry.browser.subcategory')
  if (![
    'tables', 'seating', 'beds', 'shelving', 'containers', 'barrels', 'lighting', 'banners',
    'tabletop', 'books', 'trees', 'bare-trees', 'bushes', 'grass', 'rocks', 'loot', 'tools',
    'rubble', 'pillars', 'bars', 'doors', 'stairs', 'floors', 'walls', 'misc',
  ].includes(subcategory)) {
    throw new Error('packEntry.browser.subcategory is invalid.')
  }
  return subcategory as NonNullable<DragonbaneCanonicalPackEntry['browser']>['subcategory']
}

function normalizeOptionalSizedNumber<const TValue extends number>(
  input: unknown,
  field: string,
  allowed: readonly TValue[],
): TValue | undefined {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  const value = requireNumber(input, field)
  if (!allowed.includes(value as TValue)) {
    throw new Error(`${field} must be one of ${allowed.join(', ')}.`)
  }
  return value as TValue
}

function requirePositiveNumber(input: unknown, field: string) {
  const value = requireNumber(input, field)
  if (value <= 0) {
    throw new Error(`${field} must be positive.`)
  }
  return value
}

function requireNonNegativeInteger(input: unknown, field: string) {
  const value = requireNumber(input, field)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`)
  }
  return value
}
