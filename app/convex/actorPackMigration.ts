import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

export const SAVED_CHARACTER_ACTOR_PACK_NAME = 'Saved Characters'
export const SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION =
  'Auto-created to keep saved character records available in actor packs.'

type CharacterRecord = Pick<Doc<'characters'>, '_id' | 'actorPackId' | 'workspaceId'>
type ActorPackRecord = Pick<Doc<'actorPacks'>, '_id' | 'workspaceId' | 'description'>

export function needsSavedCharacterActorPackMigration(
  character: CharacterRecord,
  workspaceId: Id<'workspaces'>,
) {
  return !character.actorPackId && (character.workspaceId === workspaceId || character.workspaceId === undefined)
}

export function needsSavedCharacterWorkspaceBackfill(
  character: CharacterRecord,
  actorPack: ActorPackRecord | null,
  workspaceId: Id<'workspaces'>,
) {
  return character.workspaceId === undefined && Boolean(character.actorPackId && actorPack?.workspaceId === workspaceId)
}

export function findSavedCharacterActorPack(
  actorPacks: ReadonlyArray<ActorPackRecord>,
  workspaceId: Id<'workspaces'>,
) {
  return actorPacks.find(
    (actorPack) =>
      actorPack.workspaceId === workspaceId
      && actorPack.description === SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
  ) ?? null
}

export function buildSavedCharacterActorPackRecord(
  ownerUserId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
  now: number,
) {
  return {
    workspaceId,
    ownerUserId,
    name: SAVED_CHARACTER_ACTOR_PACK_NAME,
    description: SAVED_CHARACTER_ACTOR_PACK_DESCRIPTION,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildSavedCharacterMigrationPatch(
  character: CharacterRecord,
  actorPackId: Id<'actorPacks'>,
  workspaceId: Id<'workspaces'>,
) {
  return {
    actorPackId,
    workspaceId: character.workspaceId ?? workspaceId,
  }
}

export async function ensureSavedCharacterActorPack(
  ctx: Pick<MutationCtx, 'db'>,
  ownerUserId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
) {
  const actorPacks = await ctx.db
    .query('actorPacks')
    .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', ownerUserId))
    .collect()
  const existingActorPack = findSavedCharacterActorPack(actorPacks, workspaceId)

  if (existingActorPack) {
    return existingActorPack._id
  }

  return ctx.db.insert('actorPacks', buildSavedCharacterActorPackRecord(ownerUserId, workspaceId, Date.now()))
}

export async function migrateSavedCharactersIntoActorPacks(
  ctx: Pick<MutationCtx, 'db'>,
  ownerUserId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
) {
  const [characters, actorPacks] = await Promise.all([
    ctx.db
      .query('characters')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', ownerUserId))
      .collect(),
    ctx.db
      .query('actorPacks')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', ownerUserId))
      .collect(),
  ])
  const actorPackById = new Map(actorPacks.map((actorPack) => [actorPack._id, actorPack]))
  const charactersNeedingPack = characters.filter((character) =>
    needsSavedCharacterActorPackMigration(character, workspaceId))
  const charactersNeedingWorkspace = characters.filter((character) =>
    needsSavedCharacterWorkspaceBackfill(
      character,
      character.actorPackId ? actorPackById.get(character.actorPackId) ?? null : null,
      workspaceId,
    ))

  if (charactersNeedingPack.length === 0 && charactersNeedingWorkspace.length === 0) {
    return null
  }

  const savedCharacterActorPack =
    charactersNeedingPack.length > 0
      ? findSavedCharacterActorPack(actorPacks, workspaceId)?._id
        ?? await ctx.db.insert('actorPacks', buildSavedCharacterActorPackRecord(ownerUserId, workspaceId, Date.now()))
      : null

  await Promise.all([
    ...charactersNeedingPack.map((character) =>
      ctx.db.patch(character._id, buildSavedCharacterMigrationPatch(character, savedCharacterActorPack!, workspaceId))),
    ...charactersNeedingWorkspace.map((character) =>
      ctx.db.patch(character._id, { workspaceId })),
  ])

  return {
    actorPackId: savedCharacterActorPack,
    migratedCharacterCount: charactersNeedingPack.length,
    workspaceBackfillCount: charactersNeedingWorkspace.length,
  }
}
