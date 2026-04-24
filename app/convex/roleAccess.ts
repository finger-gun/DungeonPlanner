export const platformRoles = ['admin', 'dm', 'player'] as const

export type PlatformRole = (typeof platformRoles)[number]

export type RoleAssignmentLike = {
  role: PlatformRole
  workspaceId?: string | null
}

export function dedupePlatformRoles(roles: Iterable<PlatformRole>) {
  return [...new Set(roles)]
}

export function resolveEffectiveRoles(
  assignments: ReadonlyArray<RoleAssignmentLike>,
  activeWorkspaceId?: string | null,
) {
  return dedupePlatformRoles(
    assignments
      .filter((assignment) => assignment.workspaceId == null || assignment.workspaceId === activeWorkspaceId)
      .map((assignment) => assignment.role),
  )
}

export function hasPlatformRole(
  roles: ReadonlyArray<PlatformRole>,
  requiredRole: PlatformRole,
) {
  if (requiredRole === 'admin') {
    return roles.includes('admin')
  }

  return roles.includes('admin') || roles.includes(requiredRole)
}

export function getRoleCapabilities(roles: ReadonlyArray<PlatformRole>) {
  return {
    isAdmin: hasPlatformRole(roles, 'admin'),
    canManageUsers: hasPlatformRole(roles, 'admin'),
    canManagePacks: hasPlatformRole(roles, 'admin'),
    canManageDungeons: hasPlatformRole(roles, 'player') || hasPlatformRole(roles, 'dm'),
    canManageSessions: hasPlatformRole(roles, 'dm'),
    canUseCharacterLibrary: hasPlatformRole(roles, 'player'),
  }
}
