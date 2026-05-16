import { describe, expect, it } from 'vitest'
import {
  buildDragonbaneCharacterSheet,
  computeDragonbaneDerivedRatings,
  validateDragonbaneTrainedSkillChoices,
} from '@dungeonplanner/shared/dragonbane/characterCreation'
import { createDragonbaneCharacterSummary } from '@dungeonplanner/shared/dragonbane/characterSheet'
import type { DragonbaneRulesPackDomains } from '@dungeonplanner/shared/dragonbane/rulesPack'

const domains: DragonbaneRulesPackDomains = {
  dragonbane: {
    schemaVersion: 1,
    kins: [{ ref: 'core:kin.human', id: 'human', name: 'Human', movement: 10, playableByPlayers: true }],
    professions: [
      {
        ref: 'core:profession.fighter',
        id: 'fighter',
        name: 'Fighter',
        keyAttributeIds: ['STR'],
        trainedSkillRefs: ['core:skill.swords', 'core:skill.evade'],
        startingEquipment: {
          weaponRefs: ['core:weapon.broadsword'],
          armorRefs: ['core:armor.leather'],
          itemRefs: ['core:rule.torch'],
          copper: 10,
        },
      },
    ],
    skills: [
      { ref: 'core:skill.swords', id: 'swords', name: 'Swords', attributeId: 'STR', isSecondary: false },
      { ref: 'core:skill.evade', id: 'evade', name: 'Evade', attributeId: 'AGL', isSecondary: false },
      { ref: 'core:skill.lore', id: 'lore', name: 'Lore', attributeId: 'INT', isSecondary: false },
    ],
    rules: {
      characterCreation: {
        ref: 'core:rule.character-creation',
        id: 'character-creation',
        ageSkillSlots: {
          Young: { total: 2, fromProfession: 1, freeChoice: 1 },
          'Middle-Aged': { total: 2, fromProfession: 1, freeChoice: 1 },
          Old: { total: 2, fromProfession: 1, freeChoice: 1 },
        },
        damageBonusRanges: {
          STR: [
            { min: 1, max: 12, bonus: 'none' },
            { min: 13, max: 16, bonus: '1d4' },
            { min: 17, bonus: '1d6' },
          ],
          AGL: [
            { min: 1, max: 12, bonus: 'none' },
            { min: 13, max: 16, bonus: '1d4' },
            { min: 17, bonus: '1d6' },
          ],
        },
        movementAgilityModifiers: [
          { max: 6, modifier: -4 },
          { min: 7, max: 12, modifier: 0 },
          { min: 13, modifier: 2 },
        ],
      },
      appearanceOptions: [],
      mementoOptions: [],
      weaknesses: [],
      heroicAbilities: [],
      magic: {
        rules: { schools: [] },
        schools: [],
      },
    },
    equipment: {
      weapons: [{ ref: 'core:weapon.broadsword', id: 'broadsword', name: 'Broadsword', damage: '2d6', features: [] }],
      armor: [{ ref: 'core:armor.leather', id: 'leather', name: 'Leather', rating: 1, movementPenalty: 0 }],
    },
  },
}

describe('Dragonbane character creation rules', () => {
  it('validates trained skill slot counts from age and profession', () => {
    expect(() =>
      validateDragonbaneTrainedSkillChoices(domains, {
        age: 'Young',
        professionRef: 'core:profession.fighter',
        trainedSkillRefs: ['core:skill.swords', 'core:skill.lore'],
      }),
    ).not.toThrow()

    expect(() =>
      validateDragonbaneTrainedSkillChoices(domains, {
        age: 'Young',
        professionRef: 'core:profession.fighter',
        trainedSkillRefs: ['core:skill.swords', 'core:skill.evade'],
      }),
    ).toThrow(/from Fighter/)
  })

  it('computes derived ratings from rules-pack data', () => {
    expect(
      computeDragonbaneDerivedRatings(domains, 'core:kin.human', {
        STR: 17,
        CON: 14,
        AGL: 13,
        INT: 10,
        WIL: 11,
        CHA: 9,
      }),
    ).toEqual({
      maxHp: 14,
      currentHp: 14,
      maxWp: 11,
      currentWp: 11,
      movement: 12,
      damageBonusStrength: '1d6',
      damageBonusAgility: '1d4',
      carryingCapacity: 9,
    })
  })

  it('builds a typed sheet with skills and initialized equipment', () => {
    const sheet = buildDragonbaneCharacterSheet(domains, {
      characterName: 'Ada',
      kinRef: 'core:kin.human',
      professionRef: 'core:profession.fighter',
      age: 'Young',
      attributes: { STR: 17, CON: 14, AGL: 13, INT: 10, WIL: 11, CHA: 9 },
      trainedSkillRefs: ['core:skill.swords', 'core:skill.lore'],
    })

    expect(sheet.system).toBe('dragonbane')
    expect(sheet.skills.find((skill) => skill.skillRef === 'core:skill.swords')?.value).toBe(14)
    expect(sheet.skills.find((skill) => skill.skillRef === 'core:skill.evade')?.value).toBe(6)
    expect(sheet.inventory.readyWeaponRefs).toEqual(['core:weapon.broadsword'])
    expect(sheet.inventory.armorRefs).toEqual(['core:armor.leather'])
    expect(sheet.inventory.copper).toBe(10)
    expect(createDragonbaneCharacterSummary(sheet, domains).movement).toBe(12)
    expect(createDragonbaneCharacterSummary(sheet, domains).weapons[0].name).toBe('Broadsword')
  })
})
