export type SessionLike = {
  ownerUserId: string
  memberUserIds: string[]
  status: 'draft' | 'active' | 'archived'
}

export type CharacterLike = {
  ownerUserId: string
}

export type DungeonLike = {
  ownerUserId: string
}

export type PackLike = {
  isActive: boolean
  visibility: 'global' | 'public' | 'private'
}

export function viewerCanAccessSession(session: SessionLike, userId: string) {
  return session.status !== 'archived' && session.memberUserIds.includes(userId)
}

export function viewerCanManageSession(session: SessionLike, userId: string) {
  return viewerCanAccessSession(session, userId) && session.ownerUserId === userId
}

export function viewerOwnsCharacter(character: CharacterLike, userId: string) {
  return character.ownerUserId === userId
}

export function viewerOwnsDungeon(dungeon: DungeonLike, userId: string) {
  return dungeon.ownerUserId === userId
}

export function sessionPackIsVisible(pack: PackLike) {
  return pack.isActive && pack.visibility !== 'private'
}
