import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { viewerCanAccessSession } from './accessPolicies'
import { requireCurrentUser, requireRoleInActiveWorkspace } from './helpers'
import { INVALID_REQUEST } from './errors'

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

type SessionLookupCtx = Pick<MutationCtx | QueryCtx, 'db'>

async function generateJoinCode(ctx: SessionLookupCtx) {
  let joinCode = ''

  for (;;) {
    joinCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const existing = await ctx.db
      .query('sessions')
      .withIndex('by_joinCode', (q) => q.eq('joinCode', joinCode))
      .unique()

    if (!existing) {
      return joinCode
    }
  }
}

function mapSessionSummary(session: Doc<'sessions'>) {
  return {
    _id: session._id,
    title: session.title,
    joinCode: session.joinCode,
    status: session.status,
    ownerUserId: session.ownerUserId,
    memberCount: session.memberUserIds.length,
    dungeonId: session.dungeonId ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
}

type SessionAccessTicket = {
  roomName: 'dungeon'
  sessionId: Id<'sessions'>
  accessToken: string
  role: 'dm' | 'player'
  expiresAt: number
}

export const listViewerSessions = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)

    if (!viewer.activeWorkspaceId) {
      return []
    }

    const workspaceId = viewer.activeWorkspaceId
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_workspaceId', (q) => q.eq('workspaceId', workspaceId))
      .collect()

    return sessions
      .filter((session) => viewerCanAccessSession(session, viewer._id))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(mapSessionSummary)
  },
})

export const createSession = mutation({
  args: {
    title: v.string(),
    dungeonId: v.optional(v.id('dungeons')),
  },
  handler: async (ctx, args) => {
    const { viewer, workspaceId } = await requireRoleInActiveWorkspace(ctx, 'dm')
    const title = args.title.trim()

    if (!title) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const now = Date.now()
    const joinCode = await generateJoinCode(ctx)
    const sessionId = await ctx.db.insert('sessions', {
      ownerUserId: viewer._id,
      workspaceId,
      dungeonId: args.dungeonId,
      title,
      joinCode,
      status: 'draft',
      memberUserIds: [viewer._id],
      characterIds: [],
      createdAt: now,
      updatedAt: now,
    })

    return {
      sessionId,
      joinCode,
    }
  },
})

export const joinSessionByCode = mutation({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const normalizedJoinCode = args.joinCode.trim().toUpperCase()

    if (!normalizedJoinCode) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const session = await ctx.db
      .query('sessions')
      .withIndex('by_joinCode', (q) => q.eq('joinCode', normalizedJoinCode))
      .unique()

    if (!session || session.status === 'archived') {
      throw new Error('Session not found.')
    }

    if (!session.memberUserIds.includes(viewer._id)) {
      await ctx.db.patch(session._id, {
        memberUserIds: [...session.memberUserIds, viewer._id],
        updatedAt: Date.now(),
      })
    }

    return {
      sessionId: session._id,
      title: session.title,
      joinCode: session.joinCode,
    }
  },
})

export const issueServerAccessTicket = mutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const session = await ctx.db.get(args.sessionId)

    if (!session || !viewerCanAccessSession(session, viewer._id)) {
      throw new Error('Session not found.')
    }

    const issuedAt = Date.now()
    const expiresAt = issuedAt + 5 * 60 * 1000
    const accessToken = generateToken()
    const role = session.ownerUserId === viewer._id ? 'dm' : 'player'

    await ctx.db.insert('sessionAccessTokens', {
      sessionId: session._id,
      userId: viewer._id,
      token: accessToken,
      role,
      issuedAt,
      expiresAt,
    })

    const payload: SessionAccessTicket = {
      roomName: 'dungeon',
      sessionId: session._id,
      accessToken,
      role,
      expiresAt,
    }

    return payload
  },
})

export const attachCharacterToSession = mutation({
  args: {
    sessionId: v.id('sessions'),
    characterId: v.id('characters'),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const session = await ctx.db.get(args.sessionId)
    const character = await ctx.db.get(args.characterId)

    if (!session || !viewerCanAccessSession(session, viewer._id)) {
      throw new Error('Session not found.')
    }

    if (!character || character.ownerUserId !== viewer._id) {
      throw new Error('Character not found.')
    }

    if (session.characterIds.includes(character._id)) {
      return args.sessionId
    }

    await ctx.db.patch(args.sessionId, {
      characterIds: [...session.characterIds, character._id],
      updatedAt: Date.now(),
    })

    return args.sessionId
  },
})

export const consumeServerAccessTicket = internalMutation({
  args: {
    sessionId: v.id('sessions'),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query('sessionAccessTokens')
      .withIndex('by_token', (q) => q.eq('token', args.accessToken))
      .unique()

    if (!tokenRecord || tokenRecord.sessionId !== args.sessionId || tokenRecord.consumedAt) {
      throw new Error('Access token is invalid.')
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error('Access token has expired.')
    }

    const session = await ctx.db.get(tokenRecord.sessionId)

    if (!session || !viewerCanAccessSession(session, tokenRecord.userId)) {
      throw new Error('Session membership is invalid.')
    }

    await ctx.db.patch(tokenRecord._id, {
      consumedAt: Date.now(),
    })

    return {
      role: tokenRecord.role,
      sessionId: session._id,
      userId: tokenRecord.userId,
    }
  },
})
