import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ATTRIBUTE_IDS = new Set(['STR', 'CON', 'AGL', 'INT', 'WIL', 'CHA'])
const AGE_NAME_BY_ID = new Map([
  ['young', 'Young'],
  ['middle_aged', 'Middle-Aged'],
  ['old', 'Old'],
])

export function importDragonbaneUnboundPacks(options = {}) {
  const sourceDir = options.sourceDir ?? '/Users/lejahmie/projects/dragonbane-unbound'
  const packDir = options.packDir ?? path.join(sourceDir, 'content-packs/core')
  const importedAt = options.importedAt ?? new Date().toISOString()
  const packManifest = readJson(path.join(packDir, 'pack.json'))
  const contentDir = path.join(packDir, 'content')
  const referenceDataDir = path.join(sourceDir, 'source_data/reference-data')
  const kinsSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-kins.json')) ?? readJson(path.join(contentDir, 'kins.json'))
  const professionsSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-professions.json')) ?? readJson(path.join(contentDir, 'professions.json'))
  const skillsSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-skills.json')) ?? readJson(path.join(contentDir, 'skills.json'))
  const rulesSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-rules.json')) ?? readJson(path.join(contentDir, 'rules.json'))
  const equipmentSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-equipment.json')) ?? readJson(path.join(contentDir, 'equipment.json'))
  const appearanceSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-appearance.json'))
  const heroicAbilitiesSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-heroic-abilities.json'))
  const magicSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-magic.json'))
  const weaknessesSource = readJsonIfExists(path.join(referenceDataDir, 'corebook-weaknesses.json'))

  // Monsterboken kins (extra playable + monster kins from the Monsterbook expansion)
  const monsterbokenKinsPath = path.join(sourceDir, 'source_data/reference-data/monsterboken-kins.json')
  const monsterbokenKinsSource = fs.existsSync(monsterbokenKinsPath) ? readJson(monsterbokenKinsPath) : null

  const corePackId = normalizePackId(packManifest.id ?? 'core')
  const monsterPackId = 'monsterboken-kins'
  const skills = normalizeSkills(corePackId, skillsSource)
  const weapons = normalizeWeapons(corePackId, equipmentSource)
  const armor = normalizeArmor(corePackId, equipmentSource)
  const equipmentNameIndex = buildEquipmentNameIndex(corePackId, weapons, armor)
  const creationRules = normalizeCharacterCreationRules(corePackId, rulesSource)
  const coreKins = normalizeKins(corePackId, kinsSource, { playableByPlayers: true })
  const professions = normalizeProfessions(corePackId, professionsSource, equipmentNameIndex)
  const appearanceOptions = appearanceSource ? normalizeAppearanceOptions(corePackId, appearanceSource) : []
  const mementoOptions = appearanceSource ? normalizeMementoOptions(corePackId, appearanceSource) : []
  const heroicAbilities = mergeByRef([
    ...(heroicAbilitiesSource ? normalizeHeroicAbilities(corePackId, heroicAbilitiesSource) : []),
    ...normalizeKinHeroicAbilities(corePackId, kinsSource),
  ])
  const magic = magicSource ? normalizeMagic(corePackId, magicSource) : createEmptyMagic()
  const weaknesses = weaknessesSource ? normalizeWeaknesses(corePackId, weaknessesSource) : []
  const monsterbokenKins = monsterbokenKinsSource
    ? normalizeMonsterbokenKins(monsterPackId, monsterbokenKinsSource)
    : []

  const sharedSourceProvenance = {
    sourceRepository: sourceDir,
    sourcePath: path.relative(sourceDir, packDir) || '.',
    sourceVersion: options.sourceVersion ?? readGitRevision(sourceDir),
    packVersion: packManifest.version ?? '0.1.0',
    importedAt,
    importer: 'dragonbane-unbound',
  }

  const coreDomains = {
    dragonbane: {
      schemaVersion: 1,
      kins: coreKins,
      professions,
      skills,
      rules: {
        characterCreation: creationRules,
        appearanceOptions,
        mementoOptions,
        weaknesses,
        heroicAbilities,
        magic,
      },
      equipment: {
        weapons,
        armor,
      },
    },
  }
  const monsterbokenDomains = {
    dragonbane: {
      schemaVersion: 1,
      kins: monsterbokenKins,
      professions: [],
      skills: [],
      rules: {
        characterCreation: {
          ...creationRules,
          ref: ref(monsterPackId, 'rule', 'character-creation'),
        },
        appearanceOptions: [],
        mementoOptions: [],
        weaknesses: [],
        heroicAbilities: normalizeKinHeroicAbilities(monsterPackId, monsterbokenKinsSource ?? { kins: [] }),
        magic: createEmptyMagic(),
      },
      equipment: {
        weapons: [],
        armor: [],
      },
    },
  }

  return [
    createRulesPackManifest({
      packId: corePackId,
      name: packManifest.name ?? 'Dragonbane Core',
      version: packManifest.version ?? '0.1.0',
      visibility: 'global',
      description: packManifest.description ?? undefined,
      isActive: true,
      alwaysActive: true,
      bundled: true,
      domains: coreDomains,
      sourceProvenance: sharedSourceProvenance,
    }),
    createRulesPackManifest({
      packId: monsterPackId,
      name: 'Dragonbane Monsterboken Kins',
      version: packManifest.version ?? '0.1.0',
      visibility: 'private',
      description: 'Additional Monsterboken kins for player characters, NPCs, and monsters.',
      isActive: true,
      alwaysActive: false,
      bundled: true,
      domains: monsterbokenDomains,
      sourceProvenance: sharedSourceProvenance,
    }),
  ]
}

export function importDragonbaneUnboundPack(options = {}) {
  return importDragonbaneUnboundPacks(options)[0]
}

function createRulesPackManifest({
  packId,
  name,
  version,
  visibility,
  description,
  isActive,
  alwaysActive,
  bundled,
  domains,
  sourceProvenance,
}) {
  return {
    packId,
    name,
    system: 'dragonbane',
    kind: 'rules',
    version,
    visibility,
    description,
    isActive,
    alwaysActive,
    bundled,
    entries: createRulesEntries(packId, domains),
    domains,
    sourceProvenance,
  }
}

function normalizeKins(packId, source, { playableByPlayers = true } = {}) {
  return requireArray(source.kins, 'kins').map((kin) => {
    const id = normalizeLocalId(kin.id)
    return {
      ref: ref(packId, 'kin', id),
      id,
      name: requiredString(kin.name, 'kin.name'),
      movement: requiredNumber(kin.movement, 'kin.movement'),
      playableByPlayers,
      heroicAbilityRef: kin.abilities?.[0]?.name ? ref(packId, 'rule', `heroic_ability.${normalizeLocalId(kin.abilities[0].name)}`) : undefined,
      source: sourceLabel(source, kin),
    }
  })
}

function normalizeMonsterbokenKins(packId, source) {
  return requireArray(source.kins, 'monsterboken kins').map((kin) => {
    const id = normalizeLocalId(kin.id)
    return {
      ref: ref(packId, 'kin', id),
      id,
      name: requiredString(kin.name, 'kin.name'),
      movement: requiredNumber(kin.movement, 'kin.movement'),
      playableByPlayers: kin.not_monster === true,
      heroicAbilityRef: kin.abilities?.[0]?.name ? ref(packId, 'rule', `heroic_ability.${normalizeLocalId(kin.abilities[0].name)}`) : undefined,
      source: sourceLabel(source, kin),
    }
  })
}

function normalizeAppearanceOptions(packId, source) {
  return requireArray(source.appearance?.list, 'appearance.list').map((entry) => {
    const id = normalizeLocalId(entry.id ?? entry.name ?? `appearance-${entry.roll}`)
    return {
      ref: ref(packId, 'rule', `appearance.${id}`),
      id,
      name: requiredString(entry.name, 'appearance.name'),
      roll: typeof entry.roll === 'number' ? entry.roll : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      source: sourceLabel(source, entry),
    }
  })
}

function normalizeMementoOptions(packId, source) {
  return requireArray(source.mementos?.list, 'mementos.list').map((entry) => {
    const id = normalizeLocalId(entry.id ?? entry.name ?? `memento-${entry.roll}`)
    return {
      ref: ref(packId, 'rule', `memento.${id}`),
      id,
      name: requiredString(entry.name, 'memento.name'),
      roll: typeof entry.roll === 'number' ? entry.roll : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      source: sourceLabel(source, entry),
    }
  })
}

function normalizeWeaknesses(packId, source) {
  return requireArray(source.weaknesses?.list, 'weaknesses.list').map((entry) => {
    const id = normalizeLocalId(entry.id ?? entry.name ?? `weakness-${entry.roll}`)
    return {
      ref: ref(packId, 'rule', `weakness.${id}`),
      id,
      name: requiredString(entry.name, 'weakness.name'),
      roll: typeof entry.roll === 'number' ? entry.roll : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      source: sourceLabel(source, entry),
    }
  })
}

function normalizeHeroicAbilities(packId, source) {
  return requireArray(source.heroic_abilities, 'heroic_abilities').map((entry) => {
    const id = normalizeLocalId(entry.id ?? entry.name)
    return {
      ref: ref(packId, 'rule', `heroic_ability.${id}`),
      id,
      name: requiredString(entry.name, 'heroic_ability.name'),
      requirement: typeof entry.requirement === 'string' ? entry.requirement : undefined,
      wpCost: typeof entry.wp_cost === 'number' ? entry.wp_cost : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      source: sourceLabel(source, entry),
    }
  })
}

function normalizeKinHeroicAbilities(packId, source) {
  return mergeByRef(
    requireArray(source.kins ?? [], 'kins').flatMap((kin) =>
      optionalArray(kin.abilities).map((ability) => {
        const id = normalizeLocalId(ability.id ?? ability.name)
        return {
          ref: ref(packId, 'rule', `heroic_ability.${id}`),
          id,
          name: requiredString(ability.name, 'kin_ability.name'),
          requirement: typeof ability.requirement === 'string' ? ability.requirement : undefined,
          wpCost: typeof ability.wp_cost === 'number' ? ability.wp_cost : undefined,
          description: typeof ability.description === 'string' ? ability.description : undefined,
          source: sourceLabel(source, ability),
        }
      }),
    ),
  )
}

function normalizeMagic(packId, source) {
  return {
    rules: {
      schools: requireArray(source.magic_rules?.schools, 'magic_rules.schools').map((school) => ({
        id: normalizeLocalId(school.id ?? school.name),
        name: requiredString(school.name, 'magic_rules.school.name'),
      })),
      preparedSpellsRule: stringOrUndefined(source.magic_rules?.prepared_spells_max),
      cantripsAlwaysPrepared: typeof source.magic_rules?.cantrips_always_prepared === 'boolean'
        ? source.magic_rules.cantrips_always_prepared
        : undefined,
      cantripCost: stringOrUndefined(source.magic_rules?.cantrip_cost),
      spellCost: stringOrUndefined(source.magic_rules?.spell_cost),
      powerLevels: Array.isArray(source.magic_rules?.power_levels)
        ? source.magic_rules.power_levels.filter((value) => typeof value === 'number')
        : undefined,
      metalRestriction: stringOrUndefined(source.magic_rules?.metal_restriction),
      spellBookRule: stringOrUndefined(source.magic_rules?.spell_book),
      learningRules: source.magic_rules?.learning_new_spells
        ? {
            fromTeacher: stringOrUndefined(source.magic_rules.learning_new_spells.from_teacher),
            fromSpellBook: stringOrUndefined(source.magic_rules.learning_new_spells.from_spell_book),
            cantrips: stringOrUndefined(source.magic_rules.learning_new_spells.cantrips),
            newSchool: stringOrUndefined(source.magic_rules.learning_new_spells.new_school),
          }
        : undefined,
    },
    schools: requireArray(source.magic_schools, 'magic_schools').map((school) => {
      const schoolId = normalizeLocalId(school.id ?? school.name)
      const linkedSkillId = school.id && school.id !== 'general' ? normalizeLocalId(school.id) : undefined

      return {
        ref: ref(packId, 'rule', `magic_school.${schoolId}`),
        id: schoolId,
        name: requiredString(school.name, 'magic_school.name'),
        linkedSkillRef: linkedSkillId ? ref(packId, 'skill', linkedSkillId) : undefined,
        cantrips: normalizeMagicSpells(packId, schoolId, school.cantrips ?? [], 'cantrip', source),
        spells: normalizeMagicSpells(packId, schoolId, school.spells ?? [], 'spell', source),
        source: sourceLabel(source, school),
      }
    }),
  }
}

function normalizeMagicSpells(packId, schoolId, spells, kind, source) {
  return requireArray(spells, `${kind}s`).map((spell) => {
    const id = normalizeLocalId(spell.id ?? spell.name)
    return {
      ref: ref(packId, 'rule', `${kind}.${schoolId}.${id}`),
      id,
      name: requiredString(spell.name, `${kind}.name`),
      rank: typeof spell.rank === 'number' ? spell.rank : undefined,
      requirement: typeof spell.requirement === 'string' ? spell.requirement : undefined,
      description: typeof spell.description === 'string' ? spell.description : undefined,
      source: sourceLabel(source, spell),
    }
  })
}

function createEmptyMagic() {
  return {
    rules: {
      schools: [],
    },
    schools: [],
  }
}

function normalizeProfessions(packId, source, equipmentNameIndex) {
  return requireArray(source.professions, 'professions').map((profession) => {
    const id = normalizeLocalId(profession.id)
    const startingEquipment = normalizeProfessionEquipment(packId, profession.gear_options?.[0]?.items ?? [], equipmentNameIndex)

    return {
      ref: ref(packId, 'profession', id),
      id,
      name: requiredString(profession.name, 'profession.name'),
      keyAttributeIds: [normalizeAttributeId(profession.key_attribute)],
      trainedSkillRefs: normalizeProfessionSkillRefs(packId, profession),
      startingEquipment,
      source: sourceLabel(source, profession),
    }
  })
}

function normalizeProfessionSkillRefs(packId, profession) {
  const skills = [
    ...optionalArray(profession.skills),
    ...optionalArray(profession.sub_types).flatMap((subType) => optionalArray(subType.skills)),
  ]

  return [...new Set(skills.map((skill) => ref(packId, 'skill', normalizeLocalId(skill.id))))]
}

function normalizeSkills(packId, source) {
  const groupedSkills = source.skills ?? {}
  const baseSkills = requireArray(groupedSkills.base_skills, 'skills.base_skills').map((skill) =>
    normalizeSkill(packId, skill, false, source),
  )
  const weaponSkills = requireArray(groupedSkills.weapon_skills, 'skills.weapon_skills').map((skill) =>
    normalizeSkill(packId, skill, false, source),
  )
  const secondarySkills = requireArray(groupedSkills.secondary_skills, 'skills.secondary_skills').map((skill) =>
    normalizeSkill(packId, skill, true, source),
  )

  return [...baseSkills, ...weaponSkills, ...secondarySkills]
}

function normalizeSkill(packId, skill, isSecondary, source) {
  const id = normalizeLocalId(skill.id)
  return {
    ref: ref(packId, 'skill', id),
    id,
    name: requiredString(skill.name, 'skill.name'),
    attributeId: normalizeAttributeId(skill.attribute),
    isSecondary,
    source: sourceLabel(source, skill),
  }
}

function normalizeCharacterCreationRules(packId, source) {
  const ageSkillSlots = Object.fromEntries(
    requireArray(source.age?.categories, 'age.categories').map((category) => {
      const ageName = AGE_NAME_BY_ID.get(category.id)
      if (!ageName) {
        throw new Error(`Unsupported Dragonbane age category: ${category.id}`)
      }

      return [
        ageName,
        {
          total: requiredNumber(category.trained_skills_total, 'trained_skills_total'),
          fromProfession: requiredNumber(category.trained_skills_from_profession, 'trained_skills_from_profession'),
          freeChoice: requiredNumber(category.trained_skills_free_choice, 'trained_skills_free_choice'),
        },
      ]
    }),
  )
  const damageBonusRanges = Object.fromEntries(
    ['STR', 'AGL'].map((attributeId) => [
      attributeId,
      requireArray(source.derived_ratings?.damage_bonus?.brackets, 'damage_bonus.brackets').map((bracket) => ({
        min: requiredNumber(bracket.range?.[0], 'damage_bonus.range[0]'),
        max: requiredNumber(bracket.range?.[1], 'damage_bonus.range[1]'),
        bonus: bracket.bonus ?? 'none',
      })),
    ]),
  )
  const movementAgilityModifiers = requireArray(
    source.derived_ratings?.movement?.agl_modifiers,
    'movement.agl_modifiers',
  ).map((modifier) => ({
    min: requiredNumber(modifier.agl_range?.[0], 'agl_range[0]'),
    max: requiredNumber(modifier.agl_range?.[1], 'agl_range[1]'),
    modifier: requiredNumber(modifier.modifier, 'agl_modifier.modifier'),
  }))

  return {
    ref: ref(packId, 'rule', 'character-creation'),
    id: 'character-creation',
    ageSkillSlots,
    damageBonusRanges,
    movementAgilityModifiers,
  }
}

function normalizeWeapons(packId, source) {
  const equipment = source.equipment ?? {}
  return [...(equipment.melee_weapons ?? []), ...(equipment.ranged_weapons ?? [])].map((weapon) => {
    const id = normalizeLocalId(weapon.id)
    return {
      ref: ref(packId, 'weapon', id),
      id,
      name: requiredString(weapon.name, 'weapon.name'),
      grip: typeof weapon.grip === 'string' ? weapon.grip : undefined,
      damage: typeof weapon.damage === 'string' ? weapon.damage : undefined,
      durability: typeof weapon.durability === 'number' ? weapon.durability : undefined,
      features: Array.isArray(weapon.properties) ? weapon.properties.filter((feature) => typeof feature === 'string') : [],
      source: sourceLabel(source, weapon),
    }
  })
}

function normalizeArmor(packId, source) {
  return requireArray(source.equipment?.armor, 'equipment.armor').map((armor) => {
    const id = normalizeLocalId(armor.id)
    return {
      ref: ref(packId, 'armor', id),
      id,
      name: requiredString(armor.name, 'armor.name'),
      rating: requiredNumber(armor.protection, 'armor.protection'),
      movementPenalty: Array.isArray(armor.mechanical_effects) && armor.mechanical_effects.length > 0 ? 1 : 0,
      source: sourceLabel(source, armor),
    }
  })
}

function normalizeProfessionEquipment(packId, items, equipmentNameIndex) {
  const weaponRefs = []
  const armorRefs = []
  const itemRefs = []
  let copper = 0

  for (const item of items) {
    const itemName = item.item
    if (typeof itemName !== 'string') {
      continue
    }

    const normalizedItemName = normalizeLocalId(itemName.replace(/^\d+d\d+\s+/, ''))
    const equipmentRef = equipmentNameIndex.get(normalizedItemName)
    if (equipmentRef?.startsWith(`${packId}:weapon.`)) {
      weaponRefs.push(equipmentRef)
    } else if (equipmentRef?.startsWith(`${packId}:armor.`)) {
      armorRefs.push(equipmentRef)
    } else if (/silver/i.test(itemName)) {
      copper += 10
    } else {
      itemRefs.push(ref(packId, 'rule', normalizedItemName))
    }
  }

  return { weaponRefs, armorRefs, itemRefs, copper }
}

function buildEquipmentNameIndex(packId, weapons, armor) {
  const index = new Map()

  for (const weapon of weapons) {
    index.set(weapon.id, weapon.ref)
    index.set(normalizeLocalId(weapon.name), weapon.ref)
  }

  for (const armorItem of armor) {
    index.set(armorItem.id, armorItem.ref)
    index.set(normalizeLocalId(armorItem.name), armorItem.ref)
  }

  index.set('knife', ref(packId, 'weapon', 'knife'))
  index.set('dagger', ref(packId, 'weapon', 'dagger'))

  return index
}

function createRulesEntries(packId, domains) {
  const dragonbane = domains.dragonbane
  const contentItems = [
    ...dragonbane.kins.map((item) => [item, 'kin']),
    ...dragonbane.professions.map((item) => [item, 'profession']),
    ...dragonbane.skills.map((item) => [item, 'skill']),
    [dragonbane.rules.characterCreation, 'rule'],
    ...dragonbane.rules.appearanceOptions.map((item) => [item, 'appearance']),
    ...dragonbane.rules.mementoOptions.map((item) => [item, 'memento']),
    ...dragonbane.rules.weaknesses.map((item) => [item, 'weakness']),
    ...dragonbane.rules.heroicAbilities.map((item) => [item, 'heroic-ability']),
    ...dragonbane.rules.magic.schools.map((item) => [item, 'magic-school']),
    ...dragonbane.rules.magic.schools.flatMap((school) => school.cantrips.map((item) => [item, 'cantrip'])),
    ...dragonbane.rules.magic.schools.flatMap((school) => school.spells.map((item) => [item, 'spell'])),
    ...dragonbane.equipment.weapons.map((item) => [item, 'weapon']),
    ...dragonbane.equipment.armor.map((item) => [item, 'armor']),
  ]

  return contentItems.map(([item, category]) => ({
    id: item.ref,
    localId: item.ref.slice(item.ref.indexOf('.') + 1),
    name: item.name ?? 'Character Creation',
    entryKind: 'rules-data',
    category: `dragonbane.${category}`,
  }))
}

function sourceLabel(source, record) {
  const sourceName = source._meta?.source
  return record.source_page && sourceName ? `${sourceName}#page=${record.source_page}` : sourceName
}

function ref(packId, domain, localId) {
  return `${packId}:${domain}.${normalizeLocalId(localId)}`
}

function normalizeAttributeId(input) {
  const attributeId = requiredString(input, 'attribute').toUpperCase()
  if (!ATTRIBUTE_IDS.has(attributeId)) {
    throw new Error(`Unsupported Dragonbane attribute id: ${input}`)
  }
  return attributeId
}

function normalizePackId(input) {
  return requiredString(input, 'packId').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeLocalId(input) {
  return requiredString(input, 'localId').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
}

function requiredString(input, field) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error(`${field} must be a non-empty string.`)
  }
  return input.trim()
}

function requiredNumber(input, field) {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    throw new Error(`${field} must be a number.`)
  }
  return input
}

function requireArray(input, field) {
  if (!Array.isArray(input)) {
    throw new Error(`${field} must be an array.`)
  }
  return input
}

function optionalArray(input) {
  return Array.isArray(input) ? input : []
}

function mergeByRef(items) {
  return [...new Map(items.map((item) => [item.ref, item])).values()]
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null
}

function stringOrUndefined(input) {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined
}

function readGitRevision(sourceDir) {
  try {
    return execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return undefined
  }
}
