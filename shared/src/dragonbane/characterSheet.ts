import type {
  DragonbaneAgeCategoryId,
  DragonbaneArmor,
  DragonbaneAttributeId,
  DragonbaneRulesPackDomains,
  DragonbaneWeapon,
} from './rulesPack'
import type { DragonbaneContentRef } from './contentRefs'

export const DRAGONBANE_CHARACTER_SHEET_VERSION = 1

export type DragonbaneAttributes = Record<DragonbaneAttributeId, number>

export type DragonbaneCharacterSheetV1 = {
  system: 'dragonbane'
  version: 1
  identity: {
    name: string
    playerName?: string
    kinRef: DragonbaneContentRef
    professionRef: DragonbaneContentRef
    age: DragonbaneAgeCategoryId
    weakness?: string
    appearance?: string
  }
  attributes: DragonbaneAttributes
  derived: {
    maxHp: number
    currentHp: number
    maxWp: number
    currentWp: number
    movement: number
    damageBonusStrength: string
    damageBonusAgility: string
    carryingCapacity: number
  }
  skills: DragonbaneCharacterSkill[]
  conditions: DragonbaneConditionState[]
  inventory: DragonbaneInventory
}

export type DragonbaneCharacterSheet = DragonbaneCharacterSheetV1

export type DragonbaneCharacterSkill = {
  skillRef: DragonbaneContentRef
  name: string
  attributeId: DragonbaneAttributeId
  value: number
  trained: boolean
}

export type DragonbaneConditionState = {
  id: 'exhausted' | 'sickly' | 'dazed' | 'angry' | 'scared' | 'disheartened'
  checked: boolean
}

export type DragonbaneInventory = {
  readyWeaponRefs: DragonbaneContentRef[]
  weaponRefs: DragonbaneContentRef[]
  armorRefs: DragonbaneContentRef[]
  itemRefs: DragonbaneContentRef[]
  copper: number
}

export type DragonbaneCharacterSummary = {
  system: 'dragonbane'
  name: string
  kinRef: DragonbaneContentRef
  professionRef: DragonbaneContentRef
  movement: number
  hp: { current: number; max: number }
  wp: { current: number; max: number }
  conditions: DragonbaneConditionState[]
  weapons: Pick<DragonbaneWeapon, 'ref' | 'name' | 'damage'>[]
  armor: Pick<DragonbaneArmor, 'ref' | 'name' | 'rating'>[]
  carryingLoad: {
    carried: number
    capacity: number
  }
}

export function isDragonbaneCharacterSheet(input: unknown): input is DragonbaneCharacterSheet {
  return isRecord(input) && input.system === 'dragonbane' && input.version === DRAGONBANE_CHARACTER_SHEET_VERSION
}

export function normalizeDragonbaneCharacterSheet(input: unknown): DragonbaneCharacterSheet | null {
  if (!isDragonbaneCharacterSheet(input)) {
    return null
  }

  return {
    system: 'dragonbane',
    version: DRAGONBANE_CHARACTER_SHEET_VERSION,
    identity: {
      name: requiredString(input.identity?.name, 'identity.name'),
      playerName: optionalString(input.identity?.playerName),
      kinRef: requiredString(input.identity?.kinRef, 'identity.kinRef') as DragonbaneContentRef,
      professionRef: requiredString(input.identity?.professionRef, 'identity.professionRef') as DragonbaneContentRef,
      age: input.identity?.age as DragonbaneAgeCategoryId,
      weakness: optionalString(input.identity?.weakness),
      appearance: optionalString(input.identity?.appearance),
    },
    attributes: normalizeAttributes(input.attributes),
    derived: {
      maxHp: requiredNumber(input.derived?.maxHp, 'derived.maxHp'),
      currentHp: requiredNumber(input.derived?.currentHp, 'derived.currentHp'),
      maxWp: requiredNumber(input.derived?.maxWp, 'derived.maxWp'),
      currentWp: requiredNumber(input.derived?.currentWp, 'derived.currentWp'),
      movement: requiredNumber(input.derived?.movement, 'derived.movement'),
      damageBonusStrength: optionalString(input.derived?.damageBonusStrength) ?? 'none',
      damageBonusAgility: optionalString(input.derived?.damageBonusAgility) ?? 'none',
      carryingCapacity: requiredNumber(input.derived?.carryingCapacity, 'derived.carryingCapacity'),
    },
    skills: Array.isArray(input.skills)
      ? input.skills.map((skill) => ({
          skillRef: requiredString(skill.skillRef, 'skill.skillRef') as DragonbaneContentRef,
          name: requiredString(skill.name, 'skill.name'),
          attributeId: skill.attributeId as DragonbaneAttributeId,
          value: requiredNumber(skill.value, 'skill.value'),
          trained: Boolean(skill.trained),
        }))
      : [],
    conditions: Array.isArray(input.conditions)
      ? input.conditions.map((condition) => ({
          id: condition.id,
          checked: Boolean(condition.checked),
        }))
      : createEmptyConditions(),
    inventory: {
      readyWeaponRefs: normalizeRefArray(input.inventory?.readyWeaponRefs),
      weaponRefs: normalizeRefArray(input.inventory?.weaponRefs),
      armorRefs: normalizeRefArray(input.inventory?.armorRefs),
      itemRefs: normalizeRefArray(input.inventory?.itemRefs),
      copper: typeof input.inventory?.copper === 'number' ? input.inventory.copper : 0,
    },
  }
}

export function createDragonbaneCharacterSummary(
  sheet: DragonbaneCharacterSheet,
  domains?: DragonbaneRulesPackDomains,
): DragonbaneCharacterSummary {
  const weaponsByRef = new Map(domains?.dragonbane.equipment.weapons.map((weapon) => [weapon.ref, weapon]) ?? [])
  const armorByRef = new Map(domains?.dragonbane.equipment.armor.map((armor) => [armor.ref, armor]) ?? [])

  return {
    system: 'dragonbane',
    name: sheet.identity.name,
    kinRef: sheet.identity.kinRef,
    professionRef: sheet.identity.professionRef,
    movement: sheet.derived.movement,
    hp: { current: sheet.derived.currentHp, max: sheet.derived.maxHp },
    wp: { current: sheet.derived.currentWp, max: sheet.derived.maxWp },
    conditions: sheet.conditions,
    weapons: sheet.inventory.weaponRefs.map((weaponRef) => {
      const weapon = weaponsByRef.get(weaponRef)
      return {
        ref: weaponRef,
        name: weapon?.name ?? weaponRef.slice(weaponRef.indexOf('.') + 1),
        damage: weapon?.damage,
      }
    }),
    armor: sheet.inventory.armorRefs.map((armorRef) => {
      const armor = armorByRef.get(armorRef)
      return {
        ref: armorRef,
        name: armor?.name ?? armorRef.slice(armorRef.indexOf('.') + 1),
        rating: armor?.rating ?? 0,
      }
    }),
    carryingLoad: {
      carried: sheet.inventory.weaponRefs.length + sheet.inventory.armorRefs.length + sheet.inventory.itemRefs.length,
      capacity: sheet.derived.carryingCapacity,
    },
  }
}

export function createEmptyConditions(): DragonbaneConditionState[] {
  return [
    { id: 'exhausted', checked: false },
    { id: 'sickly', checked: false },
    { id: 'dazed', checked: false },
    { id: 'angry', checked: false },
    { id: 'scared', checked: false },
    { id: 'disheartened', checked: false },
  ]
}

function normalizeAttributes(input: unknown): DragonbaneAttributes {
  const record = isRecord(input) ? input : {}
  return {
    STR: requiredNumber(record.STR, 'attributes.STR'),
    CON: requiredNumber(record.CON, 'attributes.CON'),
    AGL: requiredNumber(record.AGL, 'attributes.AGL'),
    INT: requiredNumber(record.INT, 'attributes.INT'),
    WIL: requiredNumber(record.WIL, 'attributes.WIL'),
    CHA: requiredNumber(record.CHA, 'attributes.CHA'),
  }
}

function normalizeRefArray(input: unknown): DragonbaneContentRef[] {
  return Array.isArray(input) ? input.filter((ref): ref is DragonbaneContentRef => typeof ref === 'string') : []
}

function isRecord(input: unknown): input is Record<string, any> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

function requiredString(input: unknown, field: string) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error(`${field} must be a non-empty string.`)
  }
  return input.trim()
}

function optionalString(input: unknown) {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined
}

function requiredNumber(input: unknown, field: string) {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    throw new Error(`${field} must be a number.`)
  }
  return input
}
