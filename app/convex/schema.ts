import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import {
  actorKindValidator,
  actorSizeValidator,
  canonicalPackEntryValidator,
  packDefaultAssetRefsValidator,
  packKindValidator,
  packVisibilityValidator,
  roleValidator,
} from './model'

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    activeWorkspaceId: v.optional(v.id('workspaces')),
  })
    .index('email', ['email'])
    .index('by_activeWorkspaceId', ['activeWorkspaceId']),
  workspaces: defineTable({
    name: v.string(),
    ownerUserId: v.id('users'),
    createdAt: v.number(),
  }).index('by_ownerUserId', ['ownerUserId']),
  roleAssignments: defineTable({
    userId: v.id('users'),
    workspaceId: v.optional(v.id('workspaces')),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_role', ['workspaceId', 'role']),
  dungeons: defineTable({
    ownerUserId: v.id('users'),
    workspaceId: v.id('workspaces'),
    title: v.string(),
    description: v.optional(v.string()),
    serializedDungeon: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_workspaceId', ['workspaceId']),
  sessions: defineTable({
    ownerUserId: v.id('users'),
    workspaceId: v.id('workspaces'),
    dungeonId: v.optional(v.id('dungeons')),
    title: v.string(),
    joinCode: v.string(),
    status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived')),
    memberUserIds: v.array(v.id('users')),
    characterIds: v.array(v.id('characters')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_joinCode', ['joinCode'])
    .index('by_workspaceId', ['workspaceId']),
  sessionAccessTokens: defineTable({
    sessionId: v.id('sessions'),
    userId: v.id('users'),
    token: v.string(),
    role: roleValidator,
    issuedAt: v.number(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index('by_token', ['token'])
    .index('by_sessionId', ['sessionId']),
  editorAccessTokens: defineTable({
    userId: v.id('users'),
    workspaceId: v.id('workspaces'),
    token: v.string(),
    issuedAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_userId', ['userId']),
  characters: defineTable({
    ownerUserId: v.id('users'),
    workspaceId: v.optional(v.id('workspaces')),
    actorPackId: v.optional(v.id('actorPacks')),
    name: v.string(),
    kind: v.optional(actorKindValidator),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    size: v.optional(actorSizeValidator),
    storageId: v.optional(v.string()),
    originalImageUrl: v.optional(v.string()),
    processedImageUrl: v.optional(v.string()),
    alphaMaskUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    contentRef: v.optional(v.string()),
    sheet: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_actorPackId', ['actorPackId'])
    .index('by_workspaceId', ['workspaceId']),
  actorPacks: defineTable({
    workspaceId: v.id('workspaces'),
    ownerUserId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_workspaceId', ['workspaceId']),
  packs: defineTable({
    workspaceId: v.id('workspaces'),
    uploaderUserId: v.id('users'),
    packId: v.string(),
    name: v.string(),
    kind: packKindValidator,
    version: v.string(),
    visibility: packVisibilityValidator,
    description: v.optional(v.string()),
    isActive: v.boolean(),
    manifestStorageId: v.optional(v.id('_storage')),
    thumbnailStorageId: v.optional(v.id('_storage')),
    defaultAssetRefs: v.optional(packDefaultAssetRefsValidator),
    entries: v.array(canonicalPackEntryValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_and_visibility', ['workspaceId', 'visibility'])
    .index('by_workspaceId_and_packId', ['workspaceId', 'packId']),
})
