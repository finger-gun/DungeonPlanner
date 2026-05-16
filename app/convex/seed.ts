import { createAccount, modifyAccountCredentials, retrieveAccount } from '@convex-dev/auth/server'
import { action } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { makeFunctionReference, type FunctionReference } from 'convex/server'
import { devSeedAccounts, type DevSeedAccount } from './devSeedAccounts'

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
