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
    email: 'admin@dungeonplanner.com',
    password: 'password',
    workspaceName: 'Admin Workspace',
    workspaceRoles: ['dm', 'player'],
    globalRoles: ['admin'],
  },
  {
    key: 'dm',
    name: 'Dev DM',
    email: 'dm@dungeonplanner.com',
    password: 'password',
    workspaceName: 'DM Workspace',
    workspaceRoles: ['dm', 'player'],
    globalRoles: [],
  },
  {
    key: 'player',
    name: 'Dev Player',
    email: 'player@dungeonplanner.com',
    password: 'password',
    workspaceName: 'Player Workspace',
    workspaceRoles: ['player'],
    globalRoles: [],
  },
]
