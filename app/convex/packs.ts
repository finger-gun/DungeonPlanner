import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { packKindValidator, packVisibilityValidator } from './model'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'

export const listWorkspacePacks = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const workspaceId = viewer.activeWorkspaceId

    if (!workspaceId) {
      return []
    }

    return ctx.db
      .query('packs')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspaceId))
      .collect()
  },
})

export const createPackRecord = mutation({
  args: {
    packId: v.string(),
    name: v.string(),
    kind: packKindValidator,
    version: v.string(),
    visibility: packVisibilityValidator,
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')

    const now = Date.now()

    return ctx.db.insert('packs', {
      workspaceId,
      uploaderUserId: viewer._id,
      packId: args.packId,
      name: args.name,
      kind: args.kind,
      version: args.version,
      visibility: args.visibility,
      description: args.description,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    })
  },
})
