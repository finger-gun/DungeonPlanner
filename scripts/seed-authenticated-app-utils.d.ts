export type SeedAccount = {
  key: 'admin' | 'dm' | 'player'
  name: string
  email: string
  password: string
  workspaceName: string
  workspaceRoles: Array<'admin' | 'dm' | 'player'>
  globalRoles: Array<'admin' | 'dm' | 'player'>
}

export const devSeedAccounts: readonly SeedAccount[]

export function formatSeedAccountSummary(accounts?: readonly SeedAccount[]): string
