import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { viewerOwnsCharacter } from './accessPolicies'
import { INVALID_REQUEST } from './errors'
import { requireCurrentUser, requireRole } from './helpers'
import { normalizeContentRef } from '../shared/contentRefs'

function mapCharacterSummary(character: Doc<'characters'>) {
  return {
    _id: character._id,
    name: character.name,
    contentRef: character.contentRef ?? null,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  }
}

export const listViewerCharacters = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireCurrentUser(ctx)
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', viewer._id))
      .collect()

    return characters
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(mapCharacterSummary)
  },
})

export const getViewerCharacter = query({
  args: {
    characterId: v.id('characters'),
  },
  handler: async (ctx, args) => {
    const viewer = await requireCurrentUser(ctx)
    const character = await ctx.db.get(args.characterId)

    if (!character || !viewerOwnsCharacter(character, viewer._id)) {
      throw new Error('Character not found.')
    }

    return {
      _id: character._id,
      name: character.name,
      contentRef: character.contentRef ?? null,
      sheet: character.sheet,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    }
  },
})

export const saveCharacter = mutation({
  args: {
    characterId: v.optional(v.id('characters')),
    name: v.string(),
    contentRef: v.optional(v.string()),
    sheet: v.any(),
  },
  handler: async (ctx, args) => {
    const { viewer } = await requireRole(ctx, 'player')
    const name = args.name.trim()

    if (!name) {
      throw new ConvexError(INVALID_REQUEST)
    }

    const workspaceId = viewer.activeWorkspaceId ?? undefined
    const now = Date.now()
    const contentRef = args.contentRef?.trim()
      ? normalizeContentRef(args.contentRef, 'character-library') ?? undefined
      : undefined

    if (args.characterId) {
      const existingCharacter = await ctx.db.get(args.characterId)

      if (!existingCharacter || !viewerOwnsCharacter(existingCharacter, viewer._id)) {
        throw new Error('Character not found.')
      }

      await ctx.db.patch(args.characterId, {
        name,
        contentRef,
        sheet: args.sheet,
        updatedAt: now,
      })

      return args.characterId
    }

    return ctx.db.insert('characters', {
      ownerUserId: viewer._id,
      workspaceId,
      name,
      contentRef,
      sheet: args.sheet,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteCharacter = mutation({
  args: {
    characterId: v.id('characters'),
  },
  handler: async (ctx, args) => {
    const { viewer } = await requireRole(ctx, 'player')
    const character = await ctx.db.get(args.characterId)

    if (!character || !viewerOwnsCharacter(character, viewer._id)) {
      throw new Error('Character not found.')
    }

    await ctx.db.delete(args.characterId)
    return args.characterId
  },
})
