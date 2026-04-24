import { mutation, query } from './_generated/server'
import { getRoleAssignmentsForUser, getViewerRoleContext, requireCurrentUser } from './helpers'
import { getRoleCapabilities } from './roleAccess'
import { ensureRoleAssignments, ensureWorkspaceForUser } from './workspaceProvisioning'

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return requireCurrentUser(ctx)
  },
})

export const viewerContext = query({
  args: {},
  handler: async (ctx) => {
    const roleContext = await getViewerRoleContext(ctx)
    const workspace = roleContext.viewer.activeWorkspaceId
      ? await ctx.db.get(roleContext.viewer.activeWorkspaceId)
      : null

    return {
      viewer: roleContext.viewer,
      workspace,
      roles: roleContext.effectiveRoles,
      access: getRoleCapabilities(roleContext.effectiveRoles),
    }
  },
})

export const initializeViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const workspaceId = await ensureWorkspaceForUser(
      ctx,
      viewer,
      viewer.name ? `${viewer.name}'s Workspace` : 'My Workspace',
    )

    await ensureRoleAssignments(ctx, viewer._id, ['dm', 'player'], workspaceId)

    const existingAssignments = await getRoleAssignmentsForUser(ctx, viewer._id)

    const globalAdmin = await ctx.db
      .query('roleAssignments')
      .withIndex('by_workspaceId_and_role', (q) => q.eq('workspaceId', undefined).eq('role', 'admin'))
      .first()

    const alreadyAdmin = existingAssignments.some(
      (assignment) => assignment.workspaceId === undefined && assignment.role === 'admin',
    )

    if (globalAdmin === null && !alreadyAdmin) {
      await ensureRoleAssignments(ctx, viewer._id, ['admin'])
    }

    return {
      workspaceId,
    }
  },
})
