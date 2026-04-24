import { describe, expect, it } from 'vitest'
import { getRoleCapabilities, hasPlatformRole, resolveEffectiveRoles } from './roleAccess'

describe('roleAccess', () => {
  it('merges global and active workspace roles', () => {
    const roles = resolveEffectiveRoles(
      [
        { role: 'player', workspaceId: 'workspace-a' },
        { role: 'dm', workspaceId: 'workspace-b' },
        { role: 'admin' },
      ],
      'workspace-a',
    )

    expect(roles).toContain('player')
    expect(roles).toContain('admin')
    expect(roles).not.toContain('dm')
  })

  it('treats admin as satisfying other role checks', () => {
    expect(hasPlatformRole(['admin'], 'dm')).toBe(true)
    expect(hasPlatformRole(['admin'], 'player')).toBe(true)
    expect(hasPlatformRole(['player'], 'dm')).toBe(false)
  })

  it('derives frontend capabilities from effective roles', () => {
    expect(getRoleCapabilities(['player'])).toMatchObject({
      isAdmin: false,
      canManageUsers: false,
      canManagePacks: false,
      canManageDungeons: true,
      canManageSessions: false,
      canUseCharacterLibrary: true,
    })

    expect(getRoleCapabilities(['admin'])).toMatchObject({
      isAdmin: true,
      canManageUsers: true,
      canManagePacks: true,
      canManageDungeons: true,
      canManageSessions: true,
      canUseCharacterLibrary: true,
    })
  })
})
