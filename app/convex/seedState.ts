import { ConvexError, v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { USER_NOT_FOUND } from './errors'
import { roleValidator } from './model'
import { ensureRoleAssignments, ensureWorkspaceForUser } from './workspaceProvisioning'

export const applySeedAccountState = internalMutation({
  args: {
    userId: v.id('users'),
    workspaceName: v.string(),
    workspaceRoles: v.array(roleValidator),
    globalRoles: v.array(roleValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)

    if (user === null) {
      throw new ConvexError(USER_NOT_FOUND)
    }

    const workspaceId = await ensureWorkspaceForUser(ctx, user, args.workspaceName)
    const createdWorkspaceRoles = await ensureRoleAssignments(
      ctx,
      user._id,
      args.workspaceRoles,
      workspaceId,
    )
    const createdGlobalRoles = await ensureRoleAssignments(
      ctx,
      user._id,
      args.globalRoles,
    )

    return {
      workspaceId,
      createdWorkspaceRoles,
      createdGlobalRoles,
    }
  },
})
