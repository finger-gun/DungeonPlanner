import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { internalQuery, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { viewerOwnsActorPack, viewerOwnsCharacter } from './accessPolicies'
import { getEditorAccessTokenRecord } from './dungeons'
import { INVALID_REQUEST } from './errors'
import { requireRoleInActiveWorkspace } from './helpers'
import { actorKindValidator, actorSizeValidator } from './model'

function buildEditorActorAssetId(actorId: string) {
  return `generated.player.${actorId}`
}

type ActorRecord = Doc<'characters'>
type ActorPackRecord = Doc<'actorPacks'>

function normalizeActorName(name: string) {
  return name.trim()
}

function normalizeActorPrompt(prompt?: string) {
  return prompt?.trim() || ''
}

function normalizeActorModel(model?: string) {
  return model?.trim() || undefined
}

async function getActorImageUrls(
  ctx: Pick<QueryCtx, 'storage'> | Pick<MutationCtx, 'storage'>,
  actor: ActorRecord,
) {
  const [
    originalImageUrl,
    processedImageUrl,
    alphaMaskUrl,
    thumbnailUrl,
  ] = await Promise.all([
    actor.originalImageStorageId ? ctx.storage.getUrl(actor.originalImageStorageId) : actor.originalImageUrl ?? null,
    actor.processedImageStorageId ? ctx.storage.getUrl(actor.processedImageStorageId) : actor.processedImageUrl ?? null,
    actor.alphaMaskStorageId ? ctx.storage.getUrl(actor.alphaMaskStorageId) : actor.alphaMaskUrl ?? null,
    actor.thumbnailStorageId ? ctx.storage.getUrl(actor.thumbnailStorageId) : actor.thumbnailUrl ?? null,
  ])

  return {
    originalImageUrl,
    processedImageUrl,
    alphaMaskUrl,
    thumbnailUrl,
  }
}

async function buildActorSummary(
  ctx: Pick<QueryCtx, 'storage'> | Pick<MutationCtx, 'storage'>,
  actor: ActorRecord,
  actorPackName: string | null,
) {
  const imageUrls = await getActorImageUrls(ctx, actor)

  return {
    _id: actor._id,
    actorPackId: actor.actorPackId ?? null,
    actorPackName,
    name: actor.name,
    kind: actor.kind ?? 'character',
    prompt: actor.prompt ?? '',
    model: actor.model ?? null,
    size: actor.size ?? 'M',
    storageId: actor.storageId ?? actor.thumbnailStorageId ?? null,
    originalImageStorageId: actor.originalImageStorageId ?? null,
    processedImageStorageId: actor.processedImageStorageId ?? null,
    alphaMaskStorageId: actor.alphaMaskStorageId ?? null,
    thumbnailStorageId: actor.thumbnailStorageId ?? null,
    originalImageUrl: imageUrls.originalImageUrl,
    processedImageUrl: imageUrls.processedImageUrl,
    alphaMaskUrl: imageUrls.alphaMaskUrl,
    thumbnailUrl: imageUrls.thumbnailUrl,
    width: actor.width ?? null,
    height: actor.height ?? null,
    createdAt: actor.createdAt,
    updatedAt: actor.updatedAt,
  }
}

function buildActorPackSummary(pack: ActorPackRecord, actorCount: number) {
  return {
    _id: pack._id,
    name: pack.name,
    description: pack.description ?? null,
    isActive: pack.isActive,
    actorCount,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
  }
}

async function getViewerActorPack(
  ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
  actorPackId: Id<'actorPacks'>,
  viewerId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
) {
  const actorPack = await ctx.db.get(actorPackId)

  if (!actorPack || !viewerOwnsActorPack(actorPack, viewerId) || actorPack.workspaceId !== workspaceId) {
    throw new Error('Actor pack not found.')
  }

  return actorPack
}

async function getViewerOwnedActor(
  ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
  actorId: Id<'characters'>,
  viewerId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
) {
  const actor = await ctx.db.get(actorId)

  if (!actor || !viewerOwnsCharacter(actor, viewerId) || actor.workspaceId !== workspaceId) {
    throw new Error('Actor not found.')
  }

  return actor
}

async function loadActorPackMap(
  ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
  workspaceId: Id<'workspaces'>,
) {
  const actorPacks = await ctx.db
    .query('actorPacks')
    .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspaceId))
    .collect()

  return new Map(actorPacks.map((actorPack) => [actorPack._id, actorPack]))
}

function collectActorStorageIds(actor: Pick<
  ActorRecord,
  | 'originalImageStorageId'
  | 'processedImageStorageId'
  | 'alphaMaskStorageId'
  | 'thumbnailStorageId'
>) {
  return [
    actor.originalImageStorageId,
    actor.processedImageStorageId,
    actor.alphaMaskStorageId,
    actor.thumbnailStorageId,
  ].filter((storageId): storageId is Id<'_storage'> => Boolean(storageId))
}

async function deleteStorageIds(
  ctx: Pick<MutationCtx, 'storage'>,
  storageIds: Iterable<Id<'_storage'>>,
) {
  await Promise.all(
    [...new Set(storageIds)].map((storageId) => ctx.storage.delete(storageId)),
  )
}

export const listViewerActorPacks = query({
  args: {},
  handler: async (ctx) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const actorPacks = await ctx.db
      .query('actorPacks')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()
    const actors = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()

    const actorCountByPack = new Map<string, number>()
    for (const actor of actors) {
      if (actor.workspaceId !== workspaceId || !actor.actorPackId) {
        continue
      }

      actorCountByPack.set(actor.actorPackId, (actorCountByPack.get(actor.actorPackId) ?? 0) + 1)
    }

    return actorPacks
      .filter((actorPack) => actorPack.workspaceId === workspaceId)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((actorPack) => buildActorPackSummary(actorPack, actorCountByPack.get(actorPack._id) ?? 0))
  },
})

export const saveActorPack = mutation({
  args: {
    actorPackId: v.optional(v.id('actorPacks')),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const name = args.name.trim()
    const description = args.description?.trim() || undefined

    if (!name) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const now = Date.now()

    if (args.actorPackId) {
      await getViewerActorPack(ctx, args.actorPackId, viewer._id, workspaceId)
      await ctx.db.patch(args.actorPackId, {
        name,
        description,
        isActive: args.isActive,
        updatedAt: now,
      })
      return args.actorPackId
    }

    return ctx.db.insert('actorPacks', {
      workspaceId,
      ownerUserId: viewer._id,
      name,
      description,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const setActorPackActive = mutation({
  args: {
    actorPackId: v.id('actorPacks'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    await getViewerActorPack(ctx, args.actorPackId, viewer._id, workspaceId)
    await ctx.db.patch(args.actorPackId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    })
    return args.actorPackId
  },
})

export const listViewerActors = query({
  args: {},
  handler: async (ctx) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const actors = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()
    const actorPackMap = await loadActorPackMap(ctx, workspaceId)

    const sortedActors = actors
      .filter((actor) => actor.workspaceId === workspaceId)
      .sort((left, right) => right.updatedAt - left.updatedAt)

    return Promise.all(
      sortedActors.map((actor) =>
        buildActorSummary(ctx, actor, actor.actorPackId ? actorPackMap.get(actor.actorPackId)?.name ?? null : null)),
    )
  },
})

export const getViewerActor = query({
  args: {
    actorId: v.id('characters'),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const actor = await getViewerOwnedActor(ctx, args.actorId, viewer._id, workspaceId)
    const actorPack = actor.actorPackId ? await ctx.db.get(actor.actorPackId) : null
    return buildActorSummary(ctx, actor, actorPack?.name ?? null)
  },
})

export const saveActor = mutation({
  args: {
    actorId: v.optional(v.id('characters')),
    actorPackId: v.id('actorPacks'),
    name: v.string(),
    kind: actorKindValidator,
    prompt: v.string(),
    model: v.optional(v.string()),
    size: actorSizeValidator,
    storageId: v.optional(v.string()),
    originalImageStorageId: v.optional(v.id('_storage')),
    processedImageStorageId: v.optional(v.id('_storage')),
    alphaMaskStorageId: v.optional(v.id('_storage')),
    thumbnailStorageId: v.optional(v.id('_storage')),
    originalImageUrl: v.optional(v.string()),
    processedImageUrl: v.optional(v.string()),
    alphaMaskUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    await getViewerActorPack(ctx, args.actorPackId, viewer._id, workspaceId)
    const name = normalizeActorName(args.name)

    if (!name) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const prompt = normalizeActorPrompt(args.prompt)
    const model = normalizeActorModel(args.model)
    const now = Date.now()

    if (args.actorId) {
      const actor = await getViewerOwnedActor(ctx, args.actorId, viewer._id, workspaceId)
      const nextOriginalImageStorageId = args.originalImageStorageId ?? actor.originalImageStorageId
      const nextProcessedImageStorageId = args.processedImageStorageId ?? actor.processedImageStorageId
      const nextAlphaMaskStorageId = args.alphaMaskStorageId ?? actor.alphaMaskStorageId
      const nextThumbnailStorageId = args.thumbnailStorageId ?? actor.thumbnailStorageId
      const nextStorageIds = new Set<Id<'_storage'>>(
        [
          nextOriginalImageStorageId,
          nextProcessedImageStorageId,
          nextAlphaMaskStorageId,
          nextThumbnailStorageId,
        ].filter((storageId): storageId is Id<'_storage'> => Boolean(storageId)),
      )
      await ctx.db.patch(args.actorId, {
        actorPackId: args.actorPackId,
        name,
        kind: args.kind,
        prompt,
        model,
        size: args.size,
        storageId: args.storageId || actor.storageId || undefined,
        originalImageStorageId: nextOriginalImageStorageId,
        processedImageStorageId: nextProcessedImageStorageId,
        alphaMaskStorageId: nextAlphaMaskStorageId,
        thumbnailStorageId: nextThumbnailStorageId,
        originalImageUrl: nextOriginalImageStorageId ? undefined : (args.originalImageUrl || actor.originalImageUrl || undefined),
        processedImageUrl: nextProcessedImageStorageId ? undefined : (args.processedImageUrl || actor.processedImageUrl || undefined),
        alphaMaskUrl: nextAlphaMaskStorageId ? undefined : (args.alphaMaskUrl || actor.alphaMaskUrl || undefined),
        thumbnailUrl: nextThumbnailStorageId ? undefined : (args.thumbnailUrl || actor.thumbnailUrl || undefined),
        width: args.width,
        height: args.height,
        updatedAt: now,
      })
      await deleteStorageIds(
        ctx,
        collectActorStorageIds(actor).filter((storageId) => !nextStorageIds.has(storageId)),
      )
      return actor._id
    }

    return ctx.db.insert('characters', {
      ownerUserId: viewer._id,
      workspaceId,
      actorPackId: args.actorPackId,
      name,
      kind: args.kind,
      prompt,
      model,
      size: args.size,
      storageId: args.storageId || undefined,
      originalImageStorageId: args.originalImageStorageId,
      processedImageStorageId: args.processedImageStorageId,
      alphaMaskStorageId: args.alphaMaskStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      originalImageUrl: args.originalImageStorageId ? undefined : (args.originalImageUrl || undefined),
      processedImageUrl: args.processedImageStorageId ? undefined : (args.processedImageUrl || undefined),
      alphaMaskUrl: args.alphaMaskStorageId ? undefined : (args.alphaMaskUrl || undefined),
      thumbnailUrl: args.thumbnailStorageId ? undefined : (args.thumbnailUrl || undefined),
      width: args.width,
      height: args.height,
      contentRef: undefined,
      sheet: {},
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteActor = mutation({
  args: {
    actorId: v.id('characters'),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const actor = await getViewerOwnedActor(ctx, args.actorId, viewer._id, workspaceId)
    await ctx.db.delete(args.actorId)
    await deleteStorageIds(ctx, collectActorStorageIds(actor))
    return { actorId: args.actorId }
  },
})

export const deleteUploadedActorImages = mutation({
  args: {
    storageIds: v.array(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    await requireRoleInActiveWorkspace(ctx, 'player')
    await deleteStorageIds(ctx, args.storageIds)
    return { deletedCount: args.storageIds.length }
  },
})

export const listEditorActors = internalQuery({
  args: {
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    const actorPacks = await ctx.db
      .query('actorPacks')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', tokenRecord.workspaceId))
      .collect()
    const activeActorPacks = actorPacks.filter((actorPack) => actorPack.isActive)
    const activeActorPackIds = new Set(activeActorPacks.map((actorPack) => actorPack._id))
    const actorPackNameById = new Map(activeActorPacks.map((actorPack) => [actorPack._id, actorPack.name]))
    const actors = await ctx.db
      .query('characters')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', tokenRecord.workspaceId))
      .collect()

    return Promise.all(
      actors
        .filter((actor) =>
          Boolean(
            actor.actorPackId &&
            activeActorPackIds.has(actor.actorPackId) &&
            (actor.processedImageStorageId || actor.processedImageUrl) &&
            (actor.thumbnailStorageId || actor.thumbnailUrl) &&
            actor.width &&
            actor.height,
          ))
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(async (actor) => {
          const imageUrls = await getActorImageUrls(ctx, actor)
          return {
            actorId: actor._id,
            actorPackId: actor.actorPackId!,
            actorPackName: actorPackNameById.get(actor.actorPackId!) ?? 'Actor Pack',
            assetId: buildEditorActorAssetId(actor._id),
            name: actor.name,
            kind: actor.kind ?? 'character',
            prompt: actor.prompt ?? '',
            model: actor.model ?? null,
            size: actor.size ?? 'M',
            storageId: actor.storageId ?? actor.thumbnailStorageId ?? null,
            originalImageUrl: imageUrls.originalImageUrl,
            processedImageUrl: imageUrls.processedImageUrl,
            alphaMaskUrl: imageUrls.alphaMaskUrl,
            thumbnailUrl: imageUrls.thumbnailUrl,
            width: actor.width ?? null,
            height: actor.height ?? null,
            createdAt: new Date(actor.createdAt).toISOString(),
            updatedAt: new Date(actor.updatedAt).toISOString(),
          }
        }),
    )
  },
})
