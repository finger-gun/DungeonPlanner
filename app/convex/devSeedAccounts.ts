export type DevSeedAccount = {
  key: 'admin' | 'dm' | 'player'
  name: string
  email: string
  password: string
  workspaceName: string
  workspaceRoles: Array<'admin' | 'dm' | 'player'>
  globalRoles: Array<'admin' | 'dm' | 'player'>
}

export const devSeedAccounts: readonly DevSeedAccount[] = [
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
]
