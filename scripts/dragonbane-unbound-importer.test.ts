import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { importDragonbaneUnboundPack, importDragonbaneUnboundPacks } from './dragonbane-unbound-importer.mjs'
import {
  validateDragonbaneRulesPackManifest,
  validateDragonbaneRulesPackDomains,
  validateDragonbaneSourceProvenance,
} from '../shared/src/dragonbane/validation'

let tempDirs: string[] = []

afterEach(() => {
  for (const tempDir of tempDirs) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
  tempDirs = []
})

describe('dragonbane-unbound importer', () => {
  it('normalizes Dragonbane Unbound content into a private DungeonPlanner rules pack payload', () => {
    const sourceDir = createFixture()
    const pack = importDragonbaneUnboundPack({
      sourceDir,
      importedAt: '2026-05-15T00:00:00.000Z',
      sourceVersion: 'fixture-revision',
    })

    const manifest = validateDragonbaneRulesPackManifest(pack)
    const domains = validateDragonbaneRulesPackDomains(pack.packId, pack.domains)
    const provenance = validateDragonbaneSourceProvenance(pack.sourceProvenance)

    expect(pack.kind).toBe('rules')
    expect(pack.system).toBe('dragonbane')
    expect(pack.visibility).toBe('global')
    expect(pack.alwaysActive).toBe(true)
    expect(pack.bundled).toBe(true)
    expect(pack.entries.some((entry) => entry.id === 'core:profession.fighter')).toBe(true)
    expect(domains.dragonbane.professions[0].trainedSkillRefs).toEqual(['core:skill.swords'])
    expect(domains.dragonbane.professions[1].trainedSkillRefs).toEqual([
      'core:skill.elementalism',
      'core:skill.languages',
    ])
    expect(domains.dragonbane.professions[0].startingEquipment.weaponRefs).toEqual(['core:weapon.broadsword'])
    expect(domains.dragonbane.rules.characterCreation.ageSkillSlots.Young.total).toBe(8)
    expect(domains.dragonbane.rules.appearanceOptions[0]?.name).toBe('Weathered cloak')
    expect(domains.dragonbane.rules.mementoOptions[0]?.name).toBe('Lucky copper')
    expect(domains.dragonbane.rules.weaknesses[0]?.name).toBe('Gullible')
    expect(domains.dragonbane.rules.heroicAbilities[0]?.name).toBe('Adaptive')
    expect(domains.dragonbane.rules.magic.schools[0]?.name).toBe('General Magic')
    expect(domains.dragonbane.rules.magic.schools[0]?.cantrips[0]?.name).toBe('Light')
    expect(provenance.sourcePath).toBe('content-packs/core')
    expect(manifest.domains.dragonbane.kins[0]?.playableByPlayers).toBe(true)
  })

  it('splits monsterboken kins into a separate optional bundled pack', () => {
    const sourceDir = createFixture()
    const packs = importDragonbaneUnboundPacks({
      sourceDir,
      importedAt: '2026-05-15T00:00:00.000Z',
      sourceVersion: 'fixture-revision',
    })

    expect(packs).toHaveLength(2)

    const monsterPack = packs.find((pack) => pack.packId === 'monsterboken-kins')
    expect(monsterPack).toBeTruthy()
    expect(monsterPack?.alwaysActive).toBe(false)
    expect(monsterPack?.bundled).toBe(true)
    expect(monsterPack?.domains.dragonbane.kins.map((kin) => kin.id)).toEqual(['orc'])
    expect(monsterPack?.domains.dragonbane.professions).toEqual([])
  })

  it.skipIf(!fs.existsSync('/Users/lejahmie/projects/dragonbane-unbound'))(
    'imports the local Dragonbane Unbound core pack',
    () => {
      const pack = importDragonbaneUnboundPack({
        sourceDir: '/Users/lejahmie/projects/dragonbane-unbound',
        importedAt: '2026-05-15T00:00:00.000Z',
      })

      const domains = validateDragonbaneRulesPackDomains(pack.packId, pack.domains)

      expect(domains.dragonbane.kins.length).toBeGreaterThan(0)
      expect(domains.dragonbane.professions.length).toBeGreaterThan(0)
      expect(domains.dragonbane.skills.length).toBeGreaterThan(0)
      expect(domains.dragonbane.professions.find((profession) => profession.name === 'Mage')?.trainedSkillRefs).toContain('core:skill.frammande_sprak')
      expect(pack.sourceProvenance.sourceRepository).toBe('/Users/lejahmie/projects/dragonbane-unbound')
    },
  )
})

function createFixture() {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragonbane-unbound-'))
  tempDirs.push(sourceDir)

  const packDir = path.join(sourceDir, 'content-packs/core')
  const contentDir = path.join(packDir, 'content')
  const referenceDataDir = path.join(sourceDir, 'source_data/reference-data')
  fs.mkdirSync(contentDir, { recursive: true })
  fs.mkdirSync(referenceDataDir, { recursive: true })

  writeJson(path.join(packDir, 'pack.json'), {
    id: 'core',
    name: 'Core Pack',
    version: '0.1.0',
    description: 'Fixture core pack',
  })
  writeJson(path.join(contentDir, 'kins.json'), {
    _meta: { source: 'fixture.pdf' },
    kins: [{ id: 'human', name: 'Human', movement: 10, abilities: [{ name: 'Adaptive' }], source_page: 13 }],
  })
  writeJson(path.join(contentDir, 'professions.json'), {
    _meta: { source: 'fixture.pdf' },
    professions: [
      {
        id: 'fighter',
        name: 'Fighter',
        key_attribute: 'STR',
        skills: [{ id: 'swords', name: 'Swords' }],
        gear_options: [{ items: [{ item: 'Broadsword' }, { item: '1d8 silver' }] }],
        source_page: 22,
      },
      {
        id: 'mage',
        name: 'Mage',
        key_attribute: 'WIL',
        sub_types: [
          {
            id: 'elementalist',
            name: 'Elementalist',
            skills: [
              { id: 'elementalism', name: 'Elementalism' },
              { id: 'languages', name: 'Languages' },
            ],
          },
        ],
        gear_options: [{ items: [{ item: 'Wooden staff' }] }],
        source_page: 27,
      },
    ],
  })
  writeJson(path.join(contentDir, 'skills.json'), {
    _meta: { source: 'fixture.pdf' },
    skills: {
      base_skills: [],
      weapon_skills: [{ id: 'swords', name: 'Swords', attribute: 'STR' }],
      secondary_skills: [
        { id: 'elementalism', name: 'Elementalism', attribute: 'INT' },
        { id: 'languages', name: 'Languages', attribute: 'INT' },
      ],
    },
  })
  writeJson(path.join(contentDir, 'rules.json'), {
    age: {
      categories: [
        {
          id: 'young',
          trained_skills_total: 8,
          trained_skills_from_profession: 6,
          trained_skills_free_choice: 2,
        },
        {
          id: 'middle_aged',
          trained_skills_total: 10,
          trained_skills_from_profession: 6,
          trained_skills_free_choice: 4,
        },
        {
          id: 'old',
          trained_skills_total: 12,
          trained_skills_from_profession: 6,
          trained_skills_free_choice: 6,
        },
      ],
    },
    derived_ratings: {
      movement: {
        agl_modifiers: [
          { agl_range: [1, 6], modifier: -4 },
          { agl_range: [7, 12], modifier: 0 },
          { agl_range: [13, 18], modifier: 2 },
        ],
      },
      damage_bonus: {
        brackets: [
          { range: [1, 12], bonus: null },
          { range: [13, 16], bonus: '1d4' },
          { range: [17, 18], bonus: '1d6' },
        ],
      },
    },
  })
  writeJson(path.join(contentDir, 'equipment.json'), {
    _meta: { source: 'fixture.pdf' },
    equipment: {
      armor: [{ id: 'leather', name: 'Leather', protection: 1, mechanical_effects: [] }],
      melee_weapons: [
        { id: 'broadsword', name: 'Broadsword', grip: '1H', damage: '2d6', durability: 15, properties: ['Slashing'] },
      ],
      ranged_weapons: [],
    },
  })
  writeJson(path.join(referenceDataDir, 'monsterboken-kins.json'), {
    _meta: { source: 'monsterboken.pdf' },
    kins: [
      {
        id: 'orc',
        name: 'Orc',
        movement: 10,
        not_monster: true,
        abilities: [{ name: 'Steadfast' }],
        source_page: 10,
      },
    ],
  })
  writeJson(path.join(referenceDataDir, 'corebook-appearance.json'), {
    _meta: { source: 'core.pdf' },
    appearance: {
      list: [{ roll: 1, name: 'Weathered cloak' }],
    },
    mementos: {
      list: [{ roll: 1, name: 'Lucky copper' }],
    },
  })
  writeJson(path.join(referenceDataDir, 'corebook-weaknesses.json'), {
    _meta: { source: 'core.pdf' },
    weaknesses: {
      list: [{ roll: 1, name: 'Gullible', description: 'Trusts everyone' }],
    },
  })
  writeJson(path.join(referenceDataDir, 'corebook-heroic-abilities.json'), {
    _meta: { source: 'core.pdf' },
    heroic_abilities: [
      { id: 'adaptive', name: 'Adaptive', wp_cost: 3, description: 'Flexible' },
    ],
  })
  writeJson(path.join(referenceDataDir, 'corebook-magic.json'), {
    _meta: { source: 'core.pdf' },
    magic_rules: {
      schools: [{ id: 'general', name: 'General Magic' }],
      prepared_spells_max: 'INT base chance',
      cantrips_always_prepared: true,
      cantrip_cost: '1 WP',
      spell_cost: '2 WP per PL',
      power_levels: [1, 2, 3],
      learning_new_spells: {
        from_teacher: 'Study with teacher',
      },
    },
    magic_schools: [
      {
        id: 'general',
        name: 'General Magic',
        cantrips: [{ name: 'Light', description: 'Glow' }],
        spells: [{ name: 'Protector', rank: 1, requirement: 'Any magic school', description: 'Ward' }],
      },
    ],
  })

  return sourceDir
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}
