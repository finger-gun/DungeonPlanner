import { describe, expect, it } from 'vitest'
import { createDragonbaneContentRef, normalizeDragonbaneContentRef } from '@dungeonplanner/shared/dragonbane/contentRefs'
import {
  validateDragonbaneRulesPackDomains,
  validateDragonbaneSourceProvenance,
} from '@dungeonplanner/shared/dragonbane/validation'

function createMinimalDomains() {
  return {
    dragonbane: {
      schemaVersion: 1,
      kins: [
        {
          id: 'human',
          name: 'Human',
          movement: 10,
        },
      ],
      professions: [
        {
          id: 'fighter',
          name: 'Fighter',
          keyAttributeIds: ['STR'],
          trainedSkillRefs: ['swords'],
          startingEquipment: {
            weaponRefs: ['broadsword'],
            armorRefs: ['leather'],
            itemRefs: [],
            copper: 12,
          },
        },
      ],
      skills: [
        {
          id: 'swords',
          name: 'Swords',
          attributeId: 'STR',
          isSecondary: false,
        },
      ],
      rules: {
        characterCreation: {
          id: 'character-creation',
          ageSkillSlots: {
            Young: { total: 6, fromProfession: 3, freeChoice: 3 },
            'Middle-Aged': { total: 8, fromProfession: 4, freeChoice: 4 },
            Old: { total: 10, fromProfession: 5, freeChoice: 5 },
          },
          damageBonusRanges: {
            STR: [{ min: 17, bonus: 'd4' }],
            AGL: [{ min: 17, bonus: 'd4' }],
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
        weapons: [
          {
            id: 'broadsword',
            name: 'Broadsword',
            features: ['Edged'],
          },
        ],
        armor: [
          {
            id: 'leather',
            name: 'Leather',
            rating: 2,
            movementPenalty: 0,
          },
        ],
      },
    },
  }
}

describe('Dragonbane content refs', () => {
  it('creates and normalizes namespaced rules content refs', () => {
    expect(createDragonbaneContentRef('Core Pack', 'skill', 'Sword Play')).toBe('core-pack:skill.sword_play')
    expect(normalizeDragonbaneContentRef('core.swords', 'skill')).toBe('core:skill.swords')
    expect(normalizeDragonbaneContentRef('swords', 'skill', 'core')).toBe('core:skill.swords')
    expect(normalizeDragonbaneContentRef('core:weapon.sword', 'skill', 'core')).toBeNull()
  })
})

describe('Dragonbane rules-pack validation', () => {
  it('normalizes structured domain payloads and source provenance', () => {
    const domains = validateDragonbaneRulesPackDomains('core', createMinimalDomains())
    const provenance = validateDragonbaneSourceProvenance({
      sourceRepository: 'https://example.com/org/dragonbane-unbound',
      sourcePath: 'content-packs/core',
      sourceVersion: 'abc123',
      packVersion: '0.1.0',
      importedAt: '2026-05-15T00:00:00.000Z',
      importer: 'dragonbane-unbound',
    })

    expect(domains.dragonbane.kins[0].ref).toBe('core:kin.human')
    expect(domains.dragonbane.professions[0].trainedSkillRefs).toEqual(['core:skill.swords'])
    expect(domains.dragonbane.equipment.weapons[0].ref).toBe('core:weapon.broadsword')
    expect(provenance.importer).toBe('dragonbane-unbound')
  })

  it('rejects rules packs that reference missing profession skills', () => {
    const domains = createMinimalDomains()
    domains.dragonbane.professions[0].trainedSkillRefs = ['missing']

    expect(() => validateDragonbaneRulesPackDomains('core', domains)).toThrow(/unknown skill/)
  })
})
