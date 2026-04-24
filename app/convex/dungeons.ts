import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'
import { migrateSavedCharactersIntoActorPacks } from './actorPackMigration'
import { viewerOwnsDungeon } from './accessPolicies'
import { requireRoleInActiveWorkspace } from './helpers'

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

function buildDungeonSummary(dungeon: {
  _id: Id<'dungeons'>
  title: string
  description?: string
  createdAt: number
  updatedAt: number
}) {
  return {
    _id: dungeon._id,
    title: dungeon.title,
    description: dungeon.description ?? null,
    createdAt: dungeon.createdAt,
    updatedAt: dungeon.updatedAt,
  }
}

function buildDungeonRecord(dungeon: {
  _id: Id<'dungeons'>
  title: string
  description?: string
  serializedDungeon: string
  createdAt: number
  updatedAt: number
}) {
  return {
    ...buildDungeonSummary(dungeon),
    serializedDungeon: dungeon.serializedDungeon,
  }
}

function buildCopiedDungeonTitle(title: string) {
  const trimmedTitle = title.trim()
  const copyMatch = trimmedTitle.match(/\(Copy(?: (\d+))?\)$/)

  if (!copyMatch) {
    return `${trimmedTitle} (Copy)`
  }

  const nextCopyNumber = copyMatch[1] ? Number(copyMatch[1]) + 1 : 2
  return trimmedTitle.replace(/\(Copy(?: \d+)?\)$/, `(Copy ${nextCopyNumber})`)
}

async function getViewerOwnedDungeon(
  ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
  dungeonId: Id<'dungeons'>,
  viewerId: Id<'users'>,
  workspaceId: Id<'workspaces'>,
) {
  const dungeon = await ctx.db.get(dungeonId)

  if (!dungeon || !viewerOwnsDungeon(dungeon, viewerId) || dungeon.workspaceId !== workspaceId) {
    throw new Error('Dungeon not found.')
  }

  return dungeon
}

export async function getEditorAccessTokenRecord(
  ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
  accessToken: string,
) {
  const tokenRecord = await ctx.db
    .query('editorAccessTokens')
    .withIndex('by_token', (q) => q.eq('token', accessToken))
    .unique()

  if (!tokenRecord) {
    throw new Error('Editor access token is invalid.')
  }

  if (tokenRecord.expiresAt < Date.now()) {
    throw new Error('Editor access token has expired.')
  }

  return tokenRecord
}

async function saveOwnedDungeon(
  ctx: MutationCtx,
  input: {
    dungeonId?: Id<'dungeons'>
    title: string
    description?: string
    serializedDungeon: string
    viewerId: Id<'users'>
    workspaceId: Id<'workspaces'>
  },
) {
  const title = input.title.trim()
  const serializedDungeon = input.serializedDungeon.trim()

  if (!title) {
    throw new Error('Dungeon title is required.')
  }

  if (!serializedDungeon) {
    throw new Error('Serialized dungeon payload is required.')
  }

  const description = input.description?.trim() || undefined
  const now = Date.now()

  if (input.dungeonId) {
    const existingDungeon = await getViewerOwnedDungeon(
      ctx,
      input.dungeonId,
      input.viewerId,
      input.workspaceId,
    )

    await ctx.db.patch(existingDungeon._id, {
      title,
      description,
      serializedDungeon,
      updatedAt: now,
    })

    return {
      ...existingDungeon,
      title,
      description,
      serializedDungeon,
      updatedAt: now,
    }
  }

  const dungeonId = await ctx.db.insert('dungeons', {
    ownerUserId: input.viewerId,
    workspaceId: input.workspaceId,
    title,
    description,
    serializedDungeon,
    createdAt: now,
    updatedAt: now,
  })

  return {
    _id: dungeonId,
    ownerUserId: input.viewerId,
    workspaceId: input.workspaceId,
    title,
    description,
    serializedDungeon,
    createdAt: now,
    updatedAt: now,
  }
}

export const listViewerDungeons = query({
  args: {},
  handler: async (ctx) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const dungeons = await ctx.db
      .query('dungeons')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()

    return dungeons
      .filter((dungeon) => dungeon.workspaceId === workspaceId)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(buildDungeonSummary)
  },
})

export const getViewerDungeon = query({
  args: {
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const dungeon = await getViewerOwnedDungeon(ctx, args.dungeonId, viewer._id, workspaceId)
    return buildDungeonRecord(dungeon)
  },
})

export const issueEditorAccessToken = mutation({
  args: {},
  handler: async (ctx) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    await migrateSavedCharactersIntoActorPacks(ctx, viewer._id, workspaceId)
    const issuedAt = Date.now()
    const expiresAt = issuedAt + 60 * 60 * 1000
    const accessToken = generateToken()

    await ctx.db.insert('editorAccessTokens', {
      userId: viewer._id,
      workspaceId,
      token: accessToken,
      issuedAt,
      expiresAt,
    })

    return {
      accessToken,
      expiresAt,
    }
  },
})

export const saveDungeon = mutation({
  args: {
    dungeonId: v.optional(v.id('dungeons')),
    title: v.string(),
    description: v.optional(v.string()),
    serializedDungeon: v.string(),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const dungeon = await saveOwnedDungeon(ctx, {
      ...args,
      viewerId: viewer._id,
      workspaceId,
    })
    return dungeon._id
  },
})

export const copyViewerDungeon = mutation({
  args: {
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    const existingDungeon = await getViewerOwnedDungeon(ctx, args.dungeonId, viewer._id, workspaceId)
    const now = Date.now()
    const dungeonId = await ctx.db.insert('dungeons', {
      ownerUserId: viewer._id,
      workspaceId,
      title: buildCopiedDungeonTitle(existingDungeon.title),
      description: existingDungeon.description,
      serializedDungeon: existingDungeon.serializedDungeon,
      createdAt: now,
      updatedAt: now,
    })

    return buildDungeonSummary({
      _id: dungeonId,
      title: buildCopiedDungeonTitle(existingDungeon.title),
      description: existingDungeon.description,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteViewerDungeon = mutation({
  args: {
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'player')
    await getViewerOwnedDungeon(ctx, args.dungeonId, viewer._id, workspaceId)
    await ctx.db.delete(args.dungeonId)
    return {
      dungeonId: args.dungeonId,
    }
  },
})

export const listEditorDungeons = internalQuery({
  args: {
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    const dungeons = await ctx.db
      .query('dungeons')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', tokenRecord.userId))
      .collect()

    return dungeons
      .filter((dungeon) => dungeon.workspaceId === tokenRecord.workspaceId)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(buildDungeonSummary)
  },
})

export const openEditorDungeon = internalQuery({
  args: {
    accessToken: v.string(),
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    const dungeon = await getViewerOwnedDungeon(
      ctx,
      args.dungeonId,
      tokenRecord.userId,
      tokenRecord.workspaceId,
    )

    return buildDungeonRecord(dungeon)
  },
})

export const saveEditorDungeon = internalMutation({
  args: {
    accessToken: v.string(),
    dungeonId: v.optional(v.id('dungeons')),
    title: v.string(),
    description: v.optional(v.string()),
    serializedDungeon: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    const dungeon = await saveOwnedDungeon(ctx, {
      dungeonId: args.dungeonId,
      title: args.title,
      description: args.description,
      serializedDungeon: args.serializedDungeon,
      viewerId: tokenRecord.userId,
      workspaceId: tokenRecord.workspaceId,
    })

    return buildDungeonSummary(dungeon)
  },
})

export const copyEditorDungeon = internalMutation({
  args: {
    accessToken: v.string(),
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    const existingDungeon = await getViewerOwnedDungeon(
      ctx,
      args.dungeonId,
      tokenRecord.userId,
      tokenRecord.workspaceId,
    )
    const copiedTitle = buildCopiedDungeonTitle(existingDungeon.title)
    const now = Date.now()
    const dungeonId = await ctx.db.insert('dungeons', {
      ownerUserId: tokenRecord.userId,
      workspaceId: tokenRecord.workspaceId,
      title: copiedTitle,
      description: existingDungeon.description,
      serializedDungeon: existingDungeon.serializedDungeon,
      createdAt: now,
      updatedAt: now,
    })

    return buildDungeonSummary({
      _id: dungeonId,
      title: copiedTitle,
      description: existingDungeon.description,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteEditorDungeon = internalMutation({
  args: {
    accessToken: v.string(),
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await getEditorAccessTokenRecord(ctx, args.accessToken)
    await getViewerOwnedDungeon(ctx, args.dungeonId, tokenRecord.userId, tokenRecord.workspaceId)
    await ctx.db.delete(args.dungeonId)
    return {
      dungeonId: args.dungeonId,
    }
  },
})
