import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireCurrentUser, requireRole } from './helpers'

export const listViewerCharacters = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)

    return ctx.db
      .query('characters')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()
  },
})

export const createCharacter = mutation({
  args: {
    name: v.string(),
    contentRef: v.optional(v.string()),
    sheet: v.any(),
  },
  handler: async (ctx, args) => {
    const { viewer } = await requireRole(ctx, 'player')
    const workspaceId = viewer.activeWorkspaceId ?? undefined
    const now = Date.now()

    return ctx.db.insert('characters', {
      ownerUserId: viewer._id,
      workspaceId,
      name: args.name,
      contentRef: args.contentRef,
      sheet: args.sheet,
      createdAt: now,
      updatedAt: now,
    })
  },
})
