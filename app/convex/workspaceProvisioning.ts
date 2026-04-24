import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { getRoleAssignmentsForUser } from './helpers'
import type { PlatformRole } from './roleAccess'

type ProvisionUser = Doc<'users'>

export async function ensureWorkspaceForUser(
  ctx: MutationCtx,
  user: ProvisionUser,
  workspaceName: string,
) {
  const existingWorkspace = user.activeWorkspaceId
    ? await ctx.db.get(user.activeWorkspaceId)
    : null

  if (existingWorkspace) {
    if (existingWorkspace.ownerUserId === user._id && existingWorkspace.name !== workspaceName) {
      await ctx.db.patch(existingWorkspace._id, {
        name: workspaceName,
      })
    }

    return existingWorkspace._id
  }

  const workspaceId = await ctx.db.insert('workspaces', {
    name: workspaceName,
    ownerUserId: user._id,
    createdAt: Date.now(),
  })

  await ctx.db.patch(user._id, {
    activeWorkspaceId: workspaceId,
  })

  return workspaceId
}

export async function ensureRoleAssignments(
  ctx: MutationCtx,
  userId: Id<'users'>,
  roles: ReadonlyArray<PlatformRole>,
  workspaceId?: Id<'workspaces'>,
) {
  const existingAssignments = await getRoleAssignmentsForUser(ctx, userId)
  const createdAssignments: PlatformRole[] = []

  for (const role of roles) {
    const assignmentExists = existingAssignments.some(
      (assignment) => assignment.role === role && assignment.workspaceId === workspaceId,
    )

    if (assignmentExists) {
      continue
    }

    await ctx.db.insert('roleAssignments', {
      userId,
      workspaceId,
      role,
      createdAt: Date.now(),
    })

    createdAssignments.push(role)
  }

  return createdAssignments
}
