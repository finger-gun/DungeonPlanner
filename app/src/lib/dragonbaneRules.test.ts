import { describe, expect, it } from 'vitest'
import { getAvailableKins, mergeDragonbaneDomains } from './dragonbaneRules'
import type { RuntimeRulesPackRecord } from './dragonbanePacks'

function createPack(packId: string, kinName: string, playableByPlayers: boolean): RuntimeRulesPackRecord {
  return {
    packId,
    name: `${packId} pack`,
    kind: 'rules',
    version: '1.0.0',
    visibility: 'public',
    isActive: true,
    alwaysActive: false,
    bundled: false,
    sourceProvenance: {
      sourceRepository: 'fixture',
      sourcePath: '.',
      packVersion: '1.0.0',
      importedAt: '2026-05-16T00:00:00.000Z',
      importer: 'dragonbane-unbound',
    },
    entries: [],
    domains: {
      dragonbane: {
        schemaVersion: 1,
        kins: [{ ref: `${packId}:kin.${kinName.toLowerCase()}`, id: kinName.toLowerCase(), name: kinName, movement: 10, playableByPlayers }],
        professions: [],
        skills: [],
        rules: {
          characterCreation: {
            ref: `${packId}:rule.character-creation`,
            id: 'character-creation',
            ageSkillSlots: {
              Young: { total: 0, fromProfession: 0, freeChoice: 0 },
              'Middle-Aged': { total: 0, fromProfession: 0, freeChoice: 0 },
              Old: { total: 0, fromProfession: 0, freeChoice: 0 },
            },
            damageBonusRanges: {},
            movementAgilityModifiers: [],
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
          weapons: [],
          armor: [],
        },
      },
    },
  }
}

describe('dragonbane rules helpers', () => {
  it('merges domains from active runtime packs', () => {
    const domains = mergeDragonbaneDomains([
      createPack('core', 'Human', true),
      createPack('monsters', 'Orc', false),
    ])

    expect(domains?.dragonbane.kins.map((kin) => kin.name)).toEqual(['Human', 'Orc'])
  })

  it('filters player kins while preserving NPC-only options for NPCs', () => {
    const domains = mergeDragonbaneDomains([
      createPack('core', 'Human', true),
      createPack('monsters', 'Orc', false),
    ])

    expect(getAvailableKins(domains, 'character').map((kin) => kin.name)).toEqual(['Human'])
    expect(getAvailableKins(domains, 'npc').map((kin) => kin.name)).toEqual(['Human', 'Orc'])
  })
})
