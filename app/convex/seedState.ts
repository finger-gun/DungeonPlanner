import { ConvexError, v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { USER_NOT_FOUND } from './errors'
import {
  canonicalPackEntryValidator,
  packSourceProvenanceValidator,
  roleValidator,
} from './model'
import { ensureRoleAssignments, ensureWorkspaceForUser } from './workspaceProvisioning'
import {
  validateDragonbaneRulesPackDomains,
  validateDragonbaneSourceProvenance,
} from '@dungeonplanner/shared/dragonbane/validation'

export const applySeedAccountState = internalMutation({
  args: {
    userId: v.id('users'),
    workspaceName: v.string(),
    workspaceRoles: v.array(roleValidator),
    globalRoles: v.array(roleValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)

    if (user === null) {
      throw new ConvexError(USER_NOT_FOUND)
    }

    const workspaceId = await ensureWorkspaceForUser(ctx, user, args.workspaceName)
    const createdWorkspaceRoles = await ensureRoleAssignments(
      ctx,
      user._id,
      args.workspaceRoles,
      workspaceId,
    )
    const createdGlobalRoles = await ensureRoleAssignments(
      ctx,
      user._id,
      args.globalRoles,
    )

    return {
      workspaceId,
      createdWorkspaceRoles,
      createdGlobalRoles,
    }
  },
})

export const upsertSeedDragonbaneRulesPack = internalMutation({
  args: {
    accountEmails: v.array(v.string()),
    pack: v.object({
      packId: v.string(),
      name: v.string(),
      system: v.literal('dragonbane'),
      version: v.string(),
      visibility: v.union(v.literal('global'), v.literal('public'), v.literal('private')),
      description: v.optional(v.string()),
      isActive: v.boolean(),
      alwaysActive: v.boolean(),
      bundled: v.boolean(),
      entries: v.array(canonicalPackEntryValidator),
      domains: v.any(),
      sourceProvenance: packSourceProvenanceValidator,
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const sourceProvenance = validateDragonbaneSourceProvenance(args.pack.sourceProvenance)
    const seeded: Array<{ email: string; packId: string; workspaceId: string }> = []

    for (const email of args.accountEmails) {
      const user = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', email))
        .unique()

      if (!user?.activeWorkspaceId) {
        continue
      }

      const domains = validateDragonbaneRulesPackDomains(args.pack.packId, args.pack.domains)
      const existingPack = await ctx.db
        .query('packs')
        .withIndex('by_workspaceId_and_packId', (q) =>
          q.eq('workspaceId', user.activeWorkspaceId!).eq('packId', args.pack.packId),
        )
        .unique()

      if (existingPack) {
        await ctx.db.patch(existingPack._id, {
          name: args.pack.name,
          kind: 'rules',
          version: args.pack.version,
          visibility: args.pack.visibility,
          description: args.pack.description,
          isActive: args.pack.visibility === 'global' ? true : args.pack.isActive,
          defaultAssetRefs: undefined,
          domains,
          sourceProvenance,
          entries: args.pack.entries,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert('packs', {
          workspaceId: user.activeWorkspaceId,
          uploaderUserId: user._id,
          packId: args.pack.packId,
          name: args.pack.name,
          kind: 'rules',
          version: args.pack.version,
          visibility: args.pack.visibility,
          description: args.pack.description,
          isActive: args.pack.visibility === 'global' ? true : args.pack.isActive,
          defaultAssetRefs: undefined,
          domains,
          sourceProvenance,
          entries: args.pack.entries,
          createdAt: now,
          updatedAt: now,
        })
      }

      seeded.push({
        email,
        packId: args.pack.packId,
        workspaceId: user.activeWorkspaceId,
      })
    }

    return { seeded }
  },
})
