import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DragonbaneCharacterCreator } from './DragonbaneCharacterCreator'

const mock = vi.hoisted(() => ({
  queries: {} as Record<string, unknown>,
  mutations: {
    'actors.saveActorPack': vi.fn(),
    'actors.deleteActorPack': vi.fn(),
    'actors.saveActor': vi.fn(),
    'actors.deleteUploadedActorImages': vi.fn(),
  } as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    actors: {
      listViewerActorPacks: 'actors.listViewerActorPacks',
      listViewerActors: 'actors.listViewerActors',
      saveActorPack: 'actors.saveActorPack',
      deleteActorPack: 'actors.deleteActorPack',
      saveActor: 'actors.saveActor',
      deleteUploadedActorImages: 'actors.deleteUploadedActorImages',
    },
  },
}))

vi.mock('../lib/backendData', () => ({
  useQuery: (queryKey: string, args: unknown) => (args === 'skip' ? undefined : mock.queries[queryKey]),
  useMutation: (mutationKey: string) => mock.mutations[mutationKey] ?? vi.fn(),
  uploadFileThroughBackend: vi.fn(),
}))

const rulesPack = {
  _id: 'pack-1',
  packId: 'core',
  name: 'Core Pack',
  kind: 'rules' as const,
  version: '1.0.0',
  visibility: 'global' as const,
  isActive: true,
  alwaysActive: true,
  bundled: true,
  description: null,
  sourceProvenance: {
    sourceRepository: 'fixture',
    sourcePath: '.',
    packVersion: '1.0.0',
    importedAt: '2026-05-16T00:00:00.000Z',
    importer: 'dragonbane-unbound' as const,
  },
  entries: [],
  domains: {
    dragonbane: {
      schemaVersion: 1 as const,
      kins: [
        { ref: 'core:kin.human' as const, id: 'human', name: 'Human', movement: 10, playableByPlayers: true },
        { ref: 'core:kin.elf' as const, id: 'elf', name: 'Elf', movement: 10, playableByPlayers: true },
      ],
      professions: [
        {
          ref: 'core:profession.fighter' as const,
          id: 'fighter',
          name: 'Fighter',
          keyAttributeIds: ['STR' as const],
          trainedSkillRefs: ['core:skill.swords' as const],
          startingEquipment: {
            weaponRefs: ['core:weapon.broadsword' as const],
            armorRefs: [],
            itemRefs: [],
            copper: 10,
          },
        },
      ],
      skills: [
        { ref: 'core:skill.swords' as const, id: 'swords', name: 'Swords', attributeId: 'STR' as const, isSecondary: false },
        { ref: 'core:skill.lore' as const, id: 'lore', name: 'Lore', attributeId: 'INT' as const, isSecondary: false },
      ],
      rules: {
        characterCreation: {
          ref: 'core:rule.character-creation' as const,
          id: 'character-creation' as const,
          ageSkillSlots: {
            Young: { total: 2, fromProfession: 1, freeChoice: 1 },
            'Middle-Aged': { total: 2, fromProfession: 1, freeChoice: 1 },
            Old: { total: 2, fromProfession: 1, freeChoice: 1 },
          },
          damageBonusRanges: {
            STR: [{ min: 1, bonus: 'none' }],
            AGL: [{ min: 1, bonus: 'none' }],
          },
          movementAgilityModifiers: [{ min: 1, modifier: 0 }],
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
        weapons: [{ ref: 'core:weapon.broadsword' as const, id: 'broadsword', name: 'Broadsword', features: [] }],
        armor: [],
      },
    },
  },
}

const expansionRulesPack = {
  _id: 'pack-2',
  packId: 'alchemy',
  name: 'Alchemy Pack',
  kind: 'rules' as const,
  version: '1.0.0',
  visibility: 'private' as const,
  isActive: true,
  alwaysActive: false,
  bundled: false,
  description: null,
  sourceProvenance: {
    sourceRepository: 'fixture',
    sourcePath: '.',
    packVersion: '1.0.0',
    importedAt: '2026-05-16T00:00:00.000Z',
    importer: 'dragonbane-unbound' as const,
  },
  entries: [],
  domains: {
    dragonbane: {
      schemaVersion: 1 as const,
      kins: [{ ref: 'alchemy:kin.clockwork' as const, id: 'clockwork', name: 'Clockwork', movement: 8, playableByPlayers: true }],
      professions: [
        {
          ref: 'alchemy:profession.alchemist' as const,
          id: 'alchemist',
          name: 'Alchemist',
          keyAttributeIds: ['INT' as const],
          trainedSkillRefs: ['alchemy:skill.alchemy' as const],
          startingEquipment: {
            weaponRefs: [],
            armorRefs: [],
            itemRefs: [],
            copper: 20,
          },
        },
      ],
      skills: [
        { ref: 'alchemy:skill.alchemy' as const, id: 'alchemy', name: 'Alchemy', attributeId: 'INT' as const, isSecondary: false },
      ],
      rules: {
        characterCreation: {
          ref: 'alchemy:rule.character-creation' as const,
          id: 'character-creation' as const,
          ageSkillSlots: {
            Young: { total: 1, fromProfession: 1, freeChoice: 0 },
            'Middle-Aged': { total: 1, fromProfession: 1, freeChoice: 0 },
            Old: { total: 1, fromProfession: 1, freeChoice: 0 },
          },
          damageBonusRanges: {
            STR: [{ min: 1, bonus: 'none' }],
            AGL: [{ min: 1, bonus: 'none' }],
          },
          movementAgilityModifiers: [{ min: 1, modifier: 0 }],
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

const legacyWorkspaceRulesPack = {
  ...rulesPack,
  _id: 'pack-legacy',
  packId: 'legacy-core',
  name: 'Legacy Core Pack',
  bundled: false,
  domains: {
    dragonbane: {
      ...rulesPack.domains.dragonbane,
      kins: [
        {
          ref: 'legacy-core:kin.elf' as const,
          id: 'elf',
          name: 'Elf',
          movement: 10,
        } as unknown as (typeof rulesPack.domains.dragonbane.kins)[number],
      ],
    },
  },
}

const savedFighterSheet = {
  system: 'dragonbane' as const,
  version: 1 as const,
  identity: {
    name: 'Drum',
    kinRef: 'core:kin.elf' as const,
    professionRef: 'core:profession.fighter' as const,
    age: 'Young' as const,
    appearance: 'scarred veteran',
  },
  attributes: { STR: 12, CON: 11, AGL: 10, INT: 9, WIL: 8, CHA: 7 },
  derived: {
    maxHp: 11,
    currentHp: 11,
    maxWp: 8,
    currentWp: 8,
    movement: 10,
    damageBonusStrength: 'none',
    damageBonusAgility: 'none',
    carryingCapacity: 24,
  },
  skills: [
    { skillRef: 'core:skill.swords' as const, name: 'Swords', attributeId: 'STR' as const, value: 24, trained: true },
    { skillRef: 'core:skill.lore' as const, name: 'Lore', attributeId: 'INT' as const, value: 18, trained: true },
  ],
  conditions: [],
  inventory: {
    readyWeaponRefs: [],
    weaponRefs: ['core:weapon.broadsword' as const],
    armorRefs: [],
    itemRefs: [],
    copper: 10,
  },
}

describe('DragonbaneCharacterCreator', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mock.queries = {
      'actors.listViewerActorPacks': [],
      'actors.listViewerActors': [],
    }
    Object.values(mock.mutations).forEach((fn) => fn.mockReset())
    mock.mutations['actors.saveActorPack'].mockResolvedValue('actor-pack-1')
    mock.mutations['actors.saveActor'].mockResolvedValue('character-1')
  })

  it('validates trained skills and saves a linked typed Dragonbane actor', async () => {
    const user = userEvent.setup()
    render(<DragonbaneCharacterCreator packs={[rulesPack]} />)
    await user.click(screen.getByRole('button', { name: 'Create new character' }))

    await user.type(screen.getByLabelText('Name'), 'Ada')
    expect(screen.getByRole('button', { name: /save character actor/i })).toBeDisabled()
    expect(mock.mutations['actors.saveActor']).not.toHaveBeenCalled()

    const skillList = screen.getByText('Trained skills').closest('section')
    expect(skillList).not.toBeNull()
    await user.click(within(skillList!).getByLabelText(/Swords/))
    await user.click(within(skillList!).getByLabelText(/Lore/))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /save character actor/i }))

    await waitFor(() => expect(mock.mutations['actors.saveActor']).toHaveBeenCalledTimes(1))
    expect(mock.mutations['actors.saveActorPack']).toHaveBeenCalledWith(expect.objectContaining({ name: 'Misc' }))
    expect(mock.mutations['actors.saveActor'].mock.calls[0][0]).toMatchObject({
      name: 'Ada',
      sheet: {
        system: 'dragonbane',
        identity: {
          name: 'Ada',
          kinRef: 'core:kin.human',
          professionRef: 'core:profession.fighter',
        },
      },
    })
  })

  it('lets the kin select change in the builder', async () => {
    const user = userEvent.setup()
    render(<DragonbaneCharacterCreator packs={[rulesPack]} />)
    await user.click(screen.getByRole('button', { name: 'Create new character' }))

    const kinSelect = screen.getByLabelText('Kin')
    expect(kinSelect).toHaveValue('core:kin.human')

    await user.selectOptions(kinSelect, 'core:kin.elf')

    expect(kinSelect).toHaveValue('core:kin.elf')
  })

  it('shows legacy kins that predate playableByPlayers', async () => {
    const user = userEvent.setup()
    render(<DragonbaneCharacterCreator packs={[legacyWorkspaceRulesPack]} />)
    await user.click(screen.getByRole('button', { name: 'Create new character' }))

    const kinSelect = screen.getByLabelText('Kin')
    expect(kinSelect).toHaveValue('legacy-core:kin.elf')
    expect(within(kinSelect).getByRole('option', { name: 'Elf' })).toBeInTheDocument()
  })

  it('merges selected Dragonbane rules sources for character choices', async () => {
    const user = userEvent.setup()
    render(<DragonbaneCharacterCreator packs={[rulesPack, expansionRulesPack]} />)
    await user.click(screen.getByRole('button', { name: 'Create new character' }))

    const professionSelect = screen.getByLabelText('Profession')
    expect(within(professionSelect).getByRole('option', { name: 'Fighter' })).toBeInTheDocument()
    expect(within(professionSelect).getByRole('option', { name: 'Alchemist' })).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Alchemy Pack' }))

    expect(within(professionSelect).getByRole('option', { name: 'Fighter' })).toBeInTheDocument()
    expect(within(professionSelect).queryByRole('option', { name: 'Alchemist' })).not.toBeInTheDocument()
  })

  it('lists saved characters by tag and opens one for editing', async () => {
    const user = userEvent.setup()
    mock.queries = {
      'actors.listViewerActorPacks': [
        { _id: 'actor-pack-1', name: 'Party', description: null, isActive: true, actorCount: 1 },
        { _id: 'actor-pack-2', name: 'Villains', description: null, isActive: true, actorCount: 0 },
      ],
      'actors.listViewerActors': [
        {
          _id: 'character-1',
          actorPackId: 'actor-pack-1',
          actorPackName: 'Party',
          name: 'Drum',
          kind: 'character',
          prompt: 'Drum prompt',
          contentRef: 'character-library:drum',
          sheet: savedFighterSheet,
          model: null,
          size: 'S',
          storageId: null,
          originalImageStorageId: null,
          processedImageStorageId: null,
          alphaMaskStorageId: null,
          thumbnailStorageId: null,
          originalImageUrl: null,
          processedImageUrl: 'standee.png',
          alphaMaskUrl: null,
          thumbnailUrl: 'thumb.png',
          width: 256,
          height: 256,
        },
      ],
    }

    render(<DragonbaneCharacterCreator packs={[rulesPack]} />)

    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(screen.queryByText('Villains')).not.toBeInTheDocument()
    expect(screen.getByText('Drum')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Drum')
    expect(screen.getByLabelText('Group tag')).toHaveValue('Party')
    expect(screen.getByLabelText('Kin')).toHaveValue('core:kin.elf')

    await user.selectOptions(screen.getByLabelText('Kin'), 'core:kin.human')
    expect(screen.getByLabelText('Kin')).toHaveValue('core:kin.human')

    await user.click(screen.getByRole('button', { name: /update character actor/i }))

    await waitFor(() => expect(mock.mutations['actors.saveActor']).toHaveBeenCalledTimes(1))
    expect(mock.mutations['actors.saveActor'].mock.calls[0][0]).toMatchObject({
      actorId: 'character-1',
      actorPackId: 'actor-pack-1',
      name: 'Drum',
      sheet: {
        identity: {
          kinRef: 'core:kin.human',
        },
      },
    })
  })

  it('hides empty tags and allows deleting a non-empty tag', async () => {
    const user = userEvent.setup()
    mock.queries = {
      'actors.listViewerActorPacks': [
        { _id: 'actor-pack-1', name: 'Party', description: null, isActive: true, actorCount: 1 },
        { _id: 'actor-pack-2', name: 'Empty', description: null, isActive: true, actorCount: 0 },
      ],
      'actors.listViewerActors': [
        {
          _id: 'character-1',
          actorPackId: 'actor-pack-1',
          actorPackName: 'Party',
          name: 'Drum',
          kind: 'character',
          prompt: 'Drum prompt',
          contentRef: 'character-library:drum',
          sheet: savedFighterSheet,
          model: null,
          size: 'S',
          storageId: null,
          originalImageStorageId: null,
          processedImageStorageId: null,
          alphaMaskStorageId: null,
          thumbnailStorageId: null,
          originalImageUrl: null,
          processedImageUrl: 'standee.png',
          alphaMaskUrl: null,
          thumbnailUrl: 'thumb.png',
          width: 256,
          height: 256,
        },
      ],
    }

    render(<DragonbaneCharacterCreator packs={[rulesPack]} />)

    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(screen.queryByText('Empty')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete tag' }))
    await waitFor(() => expect(mock.mutations['actors.deleteActorPack']).toHaveBeenCalledWith({ actorPackId: 'actor-pack-1' }))
  })
})
