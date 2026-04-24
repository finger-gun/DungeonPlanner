import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'

function generateJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export const listViewerSessions = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)

    return ctx.db
      .query('sessions')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()
  },
})

export const createSession = mutation({
  args: {
    title: v.string(),
    dungeonId: v.optional(v.id('dungeons')),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'dm')

    const now = Date.now()

    return ctx.db.insert('sessions', {
      ownerUserId: viewer._id,
      workspaceId,
      dungeonId: args.dungeonId,
      title: args.title,
      joinCode: generateJoinCode(),
      status: 'draft',
      memberUserIds: [viewer._id],
      characterIds: [],
      createdAt: now,
      updatedAt: now,
    })
  },
})
