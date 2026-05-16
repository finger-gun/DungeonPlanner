import { createAccount, modifyAccountCredentials, retrieveAccount } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { action } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { makeFunctionReference, type FunctionReference } from 'convex/server'
import { devSeedAccounts, type DevSeedAccount } from './devSeedAccounts'
import {
  canonicalPackEntryValidator,
  packSourceProvenanceValidator,
} from './model'

type ApplySeedAccountStateArgs = {
  userId: string
  workspaceName: string
  workspaceRoles: DevSeedAccount['workspaceRoles']
  globalRoles: DevSeedAccount['globalRoles']
}

type ApplySeedAccountStateResult = {
  workspaceId: string
  createdWorkspaceRoles: DevSeedAccount['workspaceRoles']
  createdGlobalRoles: DevSeedAccount['globalRoles']
}

const applySeedAccountState = makeFunctionReference<
  'mutation',
  ApplySeedAccountStateArgs,
  ApplySeedAccountStateResult
>('seedState:applySeedAccountState') as unknown as FunctionReference<
  'mutation',
  'internal',
  ApplySeedAccountStateArgs,
  ApplySeedAccountStateResult
>

type SeedDragonbaneRulesPackArgs = {
  accountEmails: string[]
  pack: {
    packId: string
    name: string
    system: 'dragonbane'
    version: string
    visibility: 'global' | 'public' | 'private'
    description?: string
    isActive: boolean
    alwaysActive: boolean
    bundled: boolean
    entries: unknown[]
    domains: unknown
    sourceProvenance: unknown
  }
}

const upsertSeedDragonbaneRulesPack = makeFunctionReference<
  'mutation',
  SeedDragonbaneRulesPackArgs,
  { seeded: Array<{ email: string; packId: string; workspaceId: string }> }
>('seedState:upsertSeedDragonbaneRulesPack') as unknown as FunctionReference<
  'mutation',
  'internal',
  SeedDragonbaneRulesPackArgs,
  { seeded: Array<{ email: string; packId: string; workspaceId: string }> }
>

async function ensurePasswordUser(
  ctx: ActionCtx,
  account: DevSeedAccount,
) {
  try {
    return await createAccount(ctx, {
      provider: 'password',
      account: {
        id: account.email,
        secret: account.password,
      },
      profile: {
        email: account.email,
        name: account.name,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes('already exists')) {
      throw error
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: {
        id: account.email,
        secret: account.password,
      },
    })

    return retrieveAccount(ctx, {
      provider: 'password',
      account: {
        id: account.email,
        secret: account.password,
      },
    })
  }
}

export const seedDevAccounts = action({
  args: {},
  handler: async (ctx): Promise<{ seeded: Array<{
    key: DevSeedAccount['key']
    email: string
    password: string
    workspaceName: string
    createdWorkspaceRoles: DevSeedAccount['workspaceRoles']
    createdGlobalRoles: DevSeedAccount['globalRoles']
  }> }> => {
    const results: Array<{
      key: DevSeedAccount['key']
      email: string
      password: string
      workspaceName: string
      createdWorkspaceRoles: DevSeedAccount['workspaceRoles']
      createdGlobalRoles: DevSeedAccount['globalRoles']
    }> = []

    for (const account of devSeedAccounts) {
      const { user } = await ensurePasswordUser(ctx, account)
      const seededState = await ctx.runMutation(applySeedAccountState, {
        userId: user._id,
        workspaceName: account.workspaceName,
        workspaceRoles: account.workspaceRoles,
        globalRoles: account.globalRoles,
      })

      results.push({
        key: account.key,
        email: account.email,
        password: account.password,
        workspaceName: account.workspaceName,
        createdWorkspaceRoles: seededState.createdWorkspaceRoles,
        createdGlobalRoles: seededState.createdGlobalRoles,
      })
    }

    return {
      seeded: results,
    }
  },
})

export const seedDevDragonbaneRulesPack = action({
  args: {
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
    return ctx.runMutation(upsertSeedDragonbaneRulesPack, {
      accountEmails: devSeedAccounts.map((account) => account.email),
      pack: args.pack,
    })
  },
})
