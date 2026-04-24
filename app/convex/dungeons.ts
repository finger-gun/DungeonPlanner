import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'

export const listViewerDungeons = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)

    return ctx.db
      .query('dungeons')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()
  },
})

export const createDungeon = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    serializedDungeon: v.any(),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'dm')

    const now = Date.now()

    return ctx.db.insert('dungeons', {
      ownerUserId: viewer._id,
      workspaceId,
      title: args.title,
      description: args.description,
      serializedDungeon: args.serializedDungeon,
      createdAt: now,
      updatedAt: now,
    })
  },
})
