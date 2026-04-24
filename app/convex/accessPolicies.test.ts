import { describe, expect, it } from 'vitest'
import {
  sessionPackIsVisible,
  viewerCanAccessSession,
  viewerCanManageSession,
  viewerOwnsCharacter,
} from './accessPolicies'

describe('access policies', () => {
  it('requires durable membership for session access', () => {
    expect(
      viewerCanAccessSession(
        { ownerUserId: 'u1', memberUserIds: ['u1', 'u2'], status: 'draft' },
        'u2',
      ),
    ).toBe(true)

    expect(
      viewerCanAccessSession(
        { ownerUserId: 'u1', memberUserIds: ['u1'], status: 'draft' },
        'u2',
      ),
    ).toBe(false)
  })

  it('limits session management to the owner', () => {
    expect(
      viewerCanManageSession(
        { ownerUserId: 'u1', memberUserIds: ['u1', 'u2'], status: 'active' },
        'u1',
      ),
    ).toBe(true)

    expect(
      viewerCanManageSession(
        { ownerUserId: 'u1', memberUserIds: ['u1', 'u2'], status: 'active' },
        'u2',
      ),
    ).toBe(false)
  })

  it('treats characters as owned records independent of placement', () => {
    expect(viewerOwnsCharacter({ ownerUserId: 'u1' }, 'u1')).toBe(true)
    expect(viewerOwnsCharacter({ ownerUserId: 'u1' }, 'u2')).toBe(false)
  })

  it('hides inactive or private packs from session members', () => {
    expect(sessionPackIsVisible({ isActive: true, visibility: 'public' })).toBe(true)
    expect(sessionPackIsVisible({ isActive: true, visibility: 'private' })).toBe(false)
    expect(sessionPackIsVisible({ isActive: false, visibility: 'global' })).toBe(false)
  })
})
