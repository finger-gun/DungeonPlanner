import { describe, expect, it } from 'vitest'
import { devSeedAccounts, formatSeedAccountSummary } from './seed-authenticated-app-utils.mjs'

describe('seed-authenticated-app-utils', () => {
  it('defines admin, dm, and player seed accounts', () => {
    expect(devSeedAccounts.map((account) => account.key)).toEqual(['admin', 'dm', 'player'])
    expect(devSeedAccounts.every((account) => account.password === 'DungeonPlanner123!')).toBe(true)
  })

  it('keeps admin global while dm and player stay workspace scoped', () => {
    const [adminAccount, dmAccount, playerAccount] = devSeedAccounts

    expect(adminAccount.globalRoles).toEqual(['admin'])
    expect(dmAccount.workspaceRoles).toEqual(['dm', 'player'])
    expect(playerAccount.workspaceRoles).toEqual(['player'])
  })

  it('formats a readable credential summary for developers', () => {
    expect(formatSeedAccountSummary()).toContain('admin@dungeonplanner.local / DungeonPlanner123!')
    expect(formatSeedAccountSummary()).toContain('global: admin')
    expect(formatSeedAccountSummary()).toContain('workspace: dm, player')
  })
})
