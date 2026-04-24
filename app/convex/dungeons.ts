import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'

export const listViewerDungeons = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const dungeons = await ctx.db
      .query('dungeons')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()

    return dungeons
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(({ _id, title, description, createdAt, updatedAt }) => ({
        _id,
        title,
        description: description ?? null,
        createdAt,
        updatedAt,
      }))
  },
})

export const getViewerDungeon = query({
  args: {
    dungeonId: v.id('dungeons'),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const dungeon = await ctx.db.get(args.dungeonId)

    if (!dungeon || dungeon.ownerUserId !== viewer._id) {
      throw new Error('Dungeon not found.')
    }

    return {
      _id: dungeon._id,
      title: dungeon.title,
      description: dungeon.description ?? null,
      serializedDungeon: dungeon.serializedDungeon,
      createdAt: dungeon.createdAt,
      updatedAt: dungeon.updatedAt,
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
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'dm')
    const title = args.title.trim()
    const serializedDungeon = args.serializedDungeon.trim()

    if (!title) {
      throw new Error('Dungeon title is required.')
    }

    if (!serializedDungeon) {
      throw new Error('Serialized dungeon payload is required.')
    }

    const description = args.description?.trim() || undefined
    const now = Date.now()

    if (args.dungeonId) {
      const existingDungeon = await ctx.db.get(args.dungeonId)

      if (!existingDungeon || existingDungeon.ownerUserId !== viewer._id || existingDungeon.workspaceId !== workspaceId) {
        throw new Error('Dungeon not found.')
      }

      await ctx.db.patch(args.dungeonId, {
        title,
        description,
        serializedDungeon,
        updatedAt: now,
      })

      return args.dungeonId
    }

    return ctx.db.insert('dungeons', {
      ownerUserId: viewer._id,
      workspaceId,
      title,
      description,
      serializedDungeon,
      createdAt: now,
      updatedAt: now,
    })
  },
})
