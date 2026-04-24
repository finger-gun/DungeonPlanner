import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query, type QueryCtx } from './_generated/server'
import {
  canonicalPackEntryValidator,
  packDefaultAssetRefsValidator,
  packKindValidator,
  packVisibilityValidator,
} from './model'
import { sessionPackIsVisible } from './accessPolicies'
import { INVALID_REQUEST } from './errors'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'
import { createContentRef, normalizeContentRef, normalizeLocalId, normalizePackId } from '../shared/contentRefs'

type CanonicalPackEntry = Doc<'packs'>['entries'][number]

function normalizePackEntry(packId: string, entry: CanonicalPackEntry): CanonicalPackEntry {
  const localId = normalizeLocalId(entry.localId)

  if (!localId) {
    throw new ConvexError(INVALID_REQUEST)
  }

  return {
    ...entry,
    id: createContentRef(packId, localId),
    localId,
    name: entry.name.trim(),
    category: entry.category.trim(),
    assetFileRef: entry.assetFileRef?.trim() || undefined,
    thumbnailFileRef: entry.thumbnailFileRef?.trim() || undefined,
    placement: entry.placement
      ? {
          ...entry.placement,
          pairedAssetRef: entry.placement.pairedAssetRef
            ? normalizeContentRef(entry.placement.pairedAssetRef, packId) ?? undefined
            : undefined,
        }
      : undefined,
    browser: entry.browser
      ? {
          ...entry.browser,
          tags: entry.browser.tags?.map((tag) => tag.trim()).filter(Boolean) ?? undefined,
        }
      : undefined,
  }
}

function normalizeDefaultAssetRefs(
  packId: string,
  defaultAssetRefs: Doc<'packs'>['defaultAssetRefs'] | undefined,
) {
  if (!defaultAssetRefs) {
    return undefined
  }

  return {
    floor: defaultAssetRefs.floor ? normalizeContentRef(defaultAssetRefs.floor, packId) ?? undefined : undefined,
    wall: defaultAssetRefs.wall ? normalizeContentRef(defaultAssetRefs.wall, packId) ?? undefined : undefined,
    opening: defaultAssetRefs.opening ? normalizeContentRef(defaultAssetRefs.opening, packId) ?? undefined : undefined,
    prop: defaultAssetRefs.prop ? normalizeContentRef(defaultAssetRefs.prop, packId) ?? undefined : undefined,
    player: defaultAssetRefs.player ? normalizeContentRef(defaultAssetRefs.player, packId) ?? undefined : undefined,
  }
}

async function mapPackRecord(
  ctx: Pick<QueryCtx, 'storage'>,
  pack: Doc<'packs'>,
) {
  const manifestUrl = pack.manifestStorageId ? await ctx.storage.getUrl(pack.manifestStorageId) : null
  const thumbnailUrl = pack.thumbnailStorageId ? await ctx.storage.getUrl(pack.thumbnailStorageId) : null

  return {
    _id: pack._id,
    packId: pack.packId,
    name: pack.name,
    kind: pack.kind,
    version: pack.version,
    visibility: pack.visibility,
    description: pack.description ?? null,
    isActive: pack.isActive,
    manifestStorageId: pack.manifestStorageId ?? null,
    thumbnailStorageId: pack.thumbnailStorageId ?? null,
    manifestUrl,
    thumbnailUrl,
    defaultAssetRefs: pack.defaultAssetRefs ?? null,
    entries: pack.entries,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
  }
}

export const listWorkspacePacks = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const workspaceId = viewer.activeWorkspaceId

    if (!workspaceId) {
      return []
    }

    const packs = await ctx.db
      .query('packs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspaceId))
      .collect()

    return Promise.all(
      packs
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((pack) => mapPackRecord(ctx, pack)),
    )
  },
})

export const listSessionPacks = query({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const session = await ctx.db.get(args.sessionId)

    if (!session || !session.memberUserIds.includes(viewer._id)) {
      throw new Error('Session not found.')
    }

    const packs = await ctx.db
      .query('packs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', session.workspaceId))
      .collect()

    return Promise.all(
      packs
        .filter((pack) => sessionPackIsVisible(pack))
        .sort((left, right) => left.packId.localeCompare(right.packId))
        .map((pack) => mapPackRecord(ctx, pack)),
    )
  },
})

export const generatePackUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRoleInActiveWorkspace(ctx, 'admin')
    return ctx.storage.generateUploadUrl()
  },
})

export const savePackRecord = mutation({
  args: {
    packRecordId: v.optional(v.id('packs')),
    packId: v.string(),
    name: v.string(),
    kind: packKindValidator,
    version: v.string(),
    visibility: packVisibilityValidator,
    description: v.optional(v.string()),
    isActive: v.boolean(),
    manifestStorageId: v.optional(v.id('_storage')),
    thumbnailStorageId: v.optional(v.id('_storage')),
    defaultAssetRefs: v.optional(packDefaultAssetRefsValidator),
    entries: v.array(canonicalPackEntryValidator),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')
    const packId = normalizePackId(args.packId)
    const name = args.name.trim()
    const version = args.version.trim()

    if (!packId || !name || !version) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const entries = args.entries.map((entry) => normalizePackEntry(packId, entry))
    const defaultAssetRefs = normalizeDefaultAssetRefs(packId, args.defaultAssetRefs)
    const isActive = args.visibility === 'global' ? true : args.isActive
    const description = args.description?.trim() || undefined
    const now = Date.now()

    const existingPack = await ctx.db
      .query('packs')
      .withIndex('by_workspaceId_and_packId', (q) => q.eq('workspaceId', workspaceId).eq('packId', packId))
      .unique()

    if (existingPack && existingPack._id !== args.packRecordId) {
      throw new Error('A pack with this packId already exists in the active workspace.')
    }

    if (args.packRecordId) {
      const packRecord = await ctx.db.get(args.packRecordId)

      if (!packRecord || packRecord.workspaceId !== workspaceId) {
        throw new Error('Pack not found.')
      }

      await ctx.db.patch(args.packRecordId, {
        packId,
        name,
        kind: args.kind,
        version,
        visibility: args.visibility,
        description,
        isActive,
        manifestStorageId: args.manifestStorageId ?? packRecord.manifestStorageId,
        thumbnailStorageId: args.thumbnailStorageId ?? packRecord.thumbnailStorageId,
        defaultAssetRefs,
        entries,
        updatedAt: now,
      })

      return args.packRecordId
    }

    return ctx.db.insert('packs', {
      workspaceId,
      uploaderUserId: viewer._id,
      packId,
      name,
      kind: args.kind,
      version,
      visibility: args.visibility,
      description,
      isActive,
      manifestStorageId: args.manifestStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      defaultAssetRefs,
      entries,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const setPackActive = mutation({
  args: {
    packRecordId: v.id('packs'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')
    const packRecord = await ctx.db.get(args.packRecordId)

    if (!packRecord || packRecord.workspaceId !== workspaceId) {
      throw new Error('Pack not found.')
    }

    await ctx.db.patch(args.packRecordId, {
      isActive: packRecord.visibility === 'global' ? true : args.isActive,
      updatedAt: Date.now(),
    })

    return args.packRecordId
  },
})
