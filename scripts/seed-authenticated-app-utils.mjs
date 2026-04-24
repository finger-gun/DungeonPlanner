export const devSeedAccounts = Object.freeze([
  {
    key: 'admin',
    name: 'Dev Admin',
    email: 'admin@dungeonplanner.local',
    password: 'DungeonPlanner123!',
    workspaceName: 'Admin Workspace',
    workspaceRoles: ['dm', 'player'],
    globalRoles: ['admin'],
  },
  {
    key: 'dm',
    name: 'Dev DM',
    email: 'dm@dungeonplanner.local',
    password: 'DungeonPlanner123!',
    workspaceName: 'DM Workspace',
    workspaceRoles: ['dm', 'player'],
    globalRoles: [],
  },
  {
    key: 'player',
    name: 'Dev Player',
    email: 'player@dungeonplanner.local',
    password: 'DungeonPlanner123!',
    workspaceName: 'Player Workspace',
    workspaceRoles: ['player'],
    globalRoles: [],
  },
])

export function formatSeedAccountSummary(accounts = devSeedAccounts) {
  return accounts
    .map((account) => {
      const scopes = [
        account.globalRoles.length > 0 ? `global: ${account.globalRoles.join(', ')}` : null,
        account.workspaceRoles.length > 0 ? `workspace: ${account.workspaceRoles.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' | ')

      return `- ${account.key}: ${account.email} / ${account.password} (${scopes})`
    })
    .join('\n')
}
