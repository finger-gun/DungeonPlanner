import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { ACTIVE_WORKSPACE_REQUIRED, UNAUTHENTICATED, UNAUTHORIZED } from './errors'
import { hasPlatformRole, resolveEffectiveRoles, type PlatformRole } from './roleAccess'

type AuthCtx = QueryCtx | MutationCtx

export async function getCurrentUser(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx)
  return userId === null ? null : ctx.db.get(userId)
}

export async function requireCurrentUser(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx)

  if (userId === null) {
    throw new ConvexError(UNAUTHENTICATED)
  }

  const user = await ctx.db.get(userId)

  if (user === null) {
    throw new ConvexError(UNAUTHENTICATED)
  }

  return user
}

export async function getRoleAssignmentsForUser(ctx: AuthCtx, userId: Id<'users'>) {
  return ctx.db
    .query('roleAssignments')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect()
}

export async function getViewerRoleContext(
  ctx: AuthCtx,
  workspaceId?: Id<'workspaces'> | null,
) {
  const viewer = await requireCurrentUser(ctx)
  const roleAssignments = await getRoleAssignmentsForUser(ctx, viewer._id)
  const activeWorkspaceId = workspaceId ?? viewer.activeWorkspaceId ?? null
  const effectiveRoles = resolveEffectiveRoles(roleAssignments, activeWorkspaceId)

  return {
    viewer,
    roleAssignments,
    activeWorkspaceId,
    effectiveRoles,
  }
}

export async function requireRole(
  ctx: AuthCtx,
  requiredRole: PlatformRole,
  workspaceId?: Id<'workspaces'> | null,
) {
  const roleContext = await getViewerRoleContext(ctx, workspaceId)

  if (!hasPlatformRole(roleContext.effectiveRoles, requiredRole)) {
    throw new ConvexError(`${UNAUTHORIZED}:${requiredRole}`)
  }

  return roleContext
}

export async function requireRoleInActiveWorkspace(
  ctx: AuthCtx,
  requiredRole: PlatformRole,
) {
  const roleContext = await requireRole(ctx, requiredRole)

  if (!roleContext.activeWorkspaceId) {
    throw new ConvexError(ACTIVE_WORKSPACE_REQUIRED)
  }

  return {
    ...roleContext,
    workspaceId: roleContext.activeWorkspaceId,
  }
}
