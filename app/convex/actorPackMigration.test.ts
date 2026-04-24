import { describe, expect, it } from 'vitest'
import {
  buildSavedCharacterActorPackRecord,
  buildSavedCharacterMigrationPatch,
  findSavedCharacterActorPack,
  needsSavedCharacterActorPackMigration,
  needsSavedCharacterWorkspaceBackfill,
  SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
  SAVED_CHARACTER_ACTOR_PACK_NAME,
} from './actorPackMigration'

describe('actor pack migration helpers', () => {
  it('flags saved characters without actor packs in the active workspace', () => {
    expect(needsSavedCharacterActorPackMigration({
      _id: 'character-1' as never,
      actorPackId: undefined,
      workspaceId: 'workspace-1' as never,
    }, 'workspace-1' as never)).toBe(true)

    expect(needsSavedCharacterActorPackMigration({
      _id: 'character-2' as never,
      actorPackId: undefined,
      workspaceId: undefined,
    }, 'workspace-1' as never)).toBe(true)

    expect(needsSavedCharacterActorPackMigration({
      _id: 'character-3' as never,
      actorPackId: 'actor-pack-1' as never,
      workspaceId: 'workspace-1' as never,
    }, 'workspace-1' as never)).toBe(false)

    expect(needsSavedCharacterActorPackMigration({
      _id: 'character-4' as never,
      actorPackId: undefined,
      workspaceId: 'workspace-2' as never,
    }, 'workspace-1' as never)).toBe(false)
  })

  it('detects actor records that only need a workspace backfill', () => {
    expect(needsSavedCharacterWorkspaceBackfill(
      {
        _id: 'character-1' as never,
        actorPackId: 'actor-pack-1' as never,
        workspaceId: undefined,
      },
      {
        _id: 'actor-pack-1' as never,
        workspaceId: 'workspace-1' as never,
        description: SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
      },
      'workspace-1' as never,
    )).toBe(true)

    expect(needsSavedCharacterWorkspaceBackfill(
      {
        _id: 'character-2' as never,
        actorPackId: 'actor-pack-1' as never,
        workspaceId: 'workspace-1' as never,
      },
      {
        _id: 'actor-pack-1' as never,
        workspaceId: 'workspace-1' as never,
        description: SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
      },
      'workspace-1' as never,
    )).toBe(false)
  })

  it('reuses only the compatibility pack created for saved characters', () => {
    expect(findSavedCharacterActorPack([
      {
        _id: 'actor-pack-1' as never,
        workspaceId: 'workspace-1' as never,
        description: 'Custom pack',
      },
      {
        _id: 'actor-pack-2' as never,
        workspaceId: 'workspace-1' as never,
        description: SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
      },
    ], 'workspace-1' as never)?._id).toBe('actor-pack-2')
  })

  it('builds the compatibility pack and patch payloads with stable defaults', () => {
    expect(buildSavedCharacterActorPackRecord(
      'user-1' as never,
      'workspace-1' as never,
      123,
    )).toEqual({
      workspaceId: 'workspace-1',
      ownerUserId: 'user-1',
      name: SAVED_CHARACTER_ACTOR_PACK_NAME,
      description: SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
      isActive: true,
      createdAt: 123,
      updatedAt: 123,
    })

    expect(buildSavedCharacterMigrationPatch(
      {
        _id: 'character-1' as never,
        actorPackId: undefined,
        workspaceId: undefined,
      },
      'actor-pack-1' as never,
      'workspace-1' as never,
    )).toEqual({
      actorPackId: 'actor-pack-1',
      workspaceId: 'workspace-1',
    })
  })
})
