import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  getRoleAssignmentsForUser,
  requireCurrentUser,
  requireRoleInActiveWorkspace,
} from './helpers'
import { LAST_ADMIN_REQUIRED, USER_NOT_FOUND } from './errors'
import { roleValidator } from './model'
import { resolveEffectiveRoles } from './roleAccess'

export const viewerAssignments = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const assignments = await getRoleAssignmentsForUser(ctx, viewer._id)

    return {
      assignments,
      effectiveRoles: resolveEffectiveRoles(assignments, viewer.activeWorkspaceId ?? null),
    }
  },
})

export const listActiveWorkspaceUsers = query({
  args: {},
  handler: async (ctx) => {
    const { workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')
    const workspaceAssignments = await ctx.db
      .query('roleAssignments')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspaceId))
      .collect()
    const globalAdmins = await ctx.db
      .query('roleAssignments')
      .withIndex('by_workspaceId_and_role', (q) => q.eq('workspaceId', undefined).eq('role', 'admin'))
      .collect()

    const userIds = [...new Set([...workspaceAssignments, ...globalAdmins].map((assignment) => assignment.userId))]
    const members = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db.get(userId)

        if (user === null) {
          return null
        }

        const assignments = await getRoleAssignmentsForUser(ctx, userId)

        return {
          userId,
          email: user.email ?? null,
          name: user.name ?? null,
          roles: resolveEffectiveRoles(assignments, workspaceId),
        }
      }),
    )

    return members
      .filter((member) => member !== null)
      .sort((left, right) => {
        const leftKey = left.email ?? left.name ?? ''
        const rightKey = right.email ?? right.name ?? ''
        return leftKey.localeCompare(rightKey)
      })
  },
})

export const grantRoleByEmail = mutation({
  args: {
    email: v.string(),
    role: roleValidator,
    scope: v.union(v.literal('workspace'), v.literal('global')),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')
    const normalizedEmail = args.email.trim().toLowerCase()
    const targetUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', normalizedEmail))
      .first()

    if (targetUser === null) {
      throw new ConvexError(USER_NOT_FOUND)
    }

    const assignmentWorkspaceId = args.scope === 'global' || args.role === 'admin' ? undefined : workspaceId
    const assignments = await getRoleAssignmentsForUser(ctx, targetUser._id)
    const existingAssignment = assignments.find(
      (assignment) =>
        assignment.role === args.role && assignment.workspaceId === assignmentWorkspaceId,
    )

    if (existingAssignment) {
      return {
        created: false,
        assignmentId: existingAssignment._id,
      }
    }

    const assignmentId = await ctx.db.insert('roleAssignments', {
      userId: targetUser._id,
      workspaceId: assignmentWorkspaceId,
      role: args.role,
      createdAt: Date.now(),
    })

    return {
      created: true,
      assignmentId,
    }
  },
})

export const revokeRoleByEmail = mutation({
  args: {
    email: v.string(),
    role: roleValidator,
    scope: v.union(v.literal('workspace'), v.literal('global')),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'admin')
    const normalizedEmail = args.email.trim().toLowerCase()
    const targetUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', normalizedEmail))
      .first()

    if (targetUser === null) {
      throw new ConvexError(USER_NOT_FOUND)
    }

    const assignmentWorkspaceId = args.scope === 'global' || args.role === 'admin' ? undefined : workspaceId
    const assignments = await getRoleAssignmentsForUser(ctx, targetUser._id)
    const assignment = assignments.find(
      (entry) => entry.role === args.role && entry.workspaceId === assignmentWorkspaceId,
    )

    if (!assignment) {
      return {
        removed: false,
      }
    }

    if (args.role === 'admin' && assignmentWorkspaceId === undefined) {
      const allAdmins = await ctx.db
        .query('roleAssignments')
        .withIndex('by_workspaceId_and_role', (q) => q.eq('workspaceId', undefined).eq('role', 'admin'))
        .collect()

      if (allAdmins.length === 1 && targetUser._id === viewer._id) {
        throw new ConvexError(LAST_ADMIN_REQUIRED)
      }
    }

    await ctx.db.delete(assignment._id)

    return {
      removed: true,
    }
  },
})
