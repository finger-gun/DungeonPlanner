import type { DragonbaneContentRef } from './contentRefs'
import type {
  DragonbaneAgeCategoryId,
  DragonbaneAttributeId,
  DragonbaneRulesPackDomains,
} from './rulesPack'
import {
  createEmptyConditions,
  type DragonbaneAttributes,
  type DragonbaneCharacterSheet,
  type DragonbaneCharacterSkill,
  type DragonbaneInventory,
} from './characterSheet'

export type DragonbaneCharacterCreationInput = {
  characterName: string
  playerName?: string
  kinRef: DragonbaneContentRef
  professionRef: DragonbaneContentRef
  age: DragonbaneAgeCategoryId
  weakness?: string
  appearance?: string
  attributes: DragonbaneAttributes
  trainedSkillRefs: DragonbaneContentRef[]
}

export function getDragonbaneTrainedSkillSlots(
  domains: DragonbaneRulesPackDomains,
  age: DragonbaneAgeCategoryId,
) {
  return domains.dragonbane.rules.characterCreation.ageSkillSlots[age]
}

export function validateDragonbaneTrainedSkillChoices(
  domains: DragonbaneRulesPackDomains,
  input: Pick<DragonbaneCharacterCreationInput, 'age' | 'professionRef' | 'trainedSkillRefs'>,
) {
  const profession = domains.dragonbane.professions.find((candidate) => candidate.ref === input.professionRef)
  if (!profession) {
    throw new Error(`Unknown Dragonbane profession ref: ${input.professionRef}`)
  }

  const slots = getDragonbaneTrainedSkillSlots(domains, input.age)
  const skillRefs = new Set(domains.dragonbane.skills.map((skill) => skill.ref))
  const unknownSkillRefs = input.trainedSkillRefs.filter((ref) => !skillRefs.has(ref))

  if (unknownSkillRefs.length > 0) {
    throw new Error(`Unknown Dragonbane trained skill refs: ${unknownSkillRefs.join(', ')}`)
  }

  const uniqueRefs = new Set(input.trainedSkillRefs)

  if (uniqueRefs.size !== input.trainedSkillRefs.length) {
    throw new Error('Trained skill choices must be unique.')
  }

  if (uniqueRefs.size !== slots.total) {
    throw new Error(`Expected ${slots.total} trained skills for ${input.age}.`)
  }

  const professionRefs = new Set(profession.trainedSkillRefs)
  const selectedProfessionCount = input.trainedSkillRefs.filter((ref) => professionRefs.has(ref)).length

  if (selectedProfessionCount !== slots.fromProfession) {
    throw new Error(`Expected ${slots.fromProfession} trained skills from ${profession.name}.`)
  }
}

export function computeDragonbaneDerivedRatings(
  domains: DragonbaneRulesPackDomains,
  kinRef: DragonbaneContentRef,
  attributes: DragonbaneAttributes,
) {
  const kin = domains.dragonbane.kins.find((candidate) => candidate.ref === kinRef)
  if (!kin) {
    throw new Error(`Unknown Dragonbane kin ref: ${kinRef}`)
  }

  return {
    maxHp: attributes.CON,
    currentHp: attributes.CON,
    maxWp: attributes.WIL,
    currentWp: attributes.WIL,
    movement: kin.movement + getMovementModifier(domains, attributes.AGL),
    damageBonusStrength: getDamageBonus(domains, 'STR', attributes.STR),
    damageBonusAgility: getDamageBonus(domains, 'AGL', attributes.AGL),
    carryingCapacity: Math.ceil(attributes.STR / 2),
  }
}

export function buildDragonbaneCharacterSheet(
  domains: DragonbaneRulesPackDomains,
  input: DragonbaneCharacterCreationInput,
): DragonbaneCharacterSheet {
  const characterName = input.characterName.trim()
  if (!characterName) {
    throw new Error('Dragonbane characters require a name.')
  }

  const kin = domains.dragonbane.kins.find((candidate) => candidate.ref === input.kinRef)
  const profession = domains.dragonbane.professions.find((candidate) => candidate.ref === input.professionRef)

  if (!kin) {
    throw new Error(`Unknown Dragonbane kin ref: ${input.kinRef}`)
  }

  if (!profession) {
    throw new Error(`Unknown Dragonbane profession ref: ${input.professionRef}`)
  }

  validateDragonbaneTrainedSkillChoices(domains, input)

  return {
    system: 'dragonbane',
    version: 1,
    identity: {
      name: characterName,
      playerName: input.playerName?.trim() || undefined,
      kinRef: kin.ref,
      professionRef: profession.ref,
      age: input.age,
      weakness: input.weakness?.trim() || undefined,
      appearance: input.appearance?.trim() || undefined,
    },
    attributes: input.attributes,
    derived: computeDragonbaneDerivedRatings(domains, kin.ref, input.attributes),
    skills: buildDragonbaneCharacterSkills(domains, input.attributes, input.trainedSkillRefs),
    conditions: createEmptyConditions(),
    inventory: initializeDragonbaneEquipment(profession.startingEquipment),
  }
}

export function buildDragonbaneCharacterSkills(
  domains: DragonbaneRulesPackDomains,
  attributes: DragonbaneAttributes,
  trainedSkillRefs: DragonbaneContentRef[],
): DragonbaneCharacterSkill[] {
  const trainedRefs = new Set(trainedSkillRefs)

  return domains.dragonbane.skills.map((skill) => {
    const baseChance = getDragonbaneSkillBaseChance(attributes[skill.attributeId])
    const trained = trainedRefs.has(skill.ref)

    return {
      skillRef: skill.ref,
      name: skill.name,
      attributeId: skill.attributeId,
      value: trained ? baseChance * 2 : baseChance,
      trained,
    }
  })
}

export function getDragonbaneSkillBaseChance(attributeValue: number) {
  if (attributeValue <= 5) return 3
  if (attributeValue <= 8) return 4
  if (attributeValue <= 12) return 5
  if (attributeValue <= 15) return 6
  return 7
}

export function initializeDragonbaneEquipment(
  startingEquipment: Pick<DragonbaneInventory, 'weaponRefs' | 'armorRefs' | 'itemRefs' | 'copper'>,
): DragonbaneInventory {
  return {
    readyWeaponRefs: startingEquipment.weaponRefs.slice(0, 3),
    weaponRefs: [...startingEquipment.weaponRefs],
    armorRefs: [...startingEquipment.armorRefs],
    itemRefs: [...startingEquipment.itemRefs],
    copper: startingEquipment.copper,
  }
}

function getDamageBonus(
  domains: DragonbaneRulesPackDomains,
  attributeId: DragonbaneAttributeId,
  attributeValue: number,
) {
  const ranges = domains.dragonbane.rules.characterCreation.damageBonusRanges[attributeId] ?? []
  const range = ranges.find((candidate) => {
    const aboveMin = attributeValue >= candidate.min
    const belowMax = candidate.max === undefined || attributeValue <= candidate.max
    return aboveMin && belowMax
  })

  return range?.bonus ?? 'none'
}

function getMovementModifier(domains: DragonbaneRulesPackDomains, agility: number) {
  const modifier = domains.dragonbane.rules.characterCreation.movementAgilityModifiers.find((candidate) => {
    const aboveMin = candidate.min === undefined || agility >= candidate.min
    const belowMax = candidate.max === undefined || agility <= candidate.max
    return aboveMin && belowMax
  })

  return modifier?.modifier ?? 0
}
