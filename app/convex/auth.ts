import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'
import { INVALID_AUTH_PROFILE } from './errors'
import type { DataModel } from './_generated/dataModel'

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new ConvexError(`${INVALID_AUTH_PROFILE}:${fieldName}`)
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    throw new ConvexError(`${INVALID_AUTH_PROFILE}:${fieldName}`)
  }

  return trimmedValue
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = requireString(params.email, 'email').toLowerCase()
        const name = typeof params.name === 'string' && params.name.trim() ? params.name.trim() : undefined

        return {
          email,
          ...(name ? { name } : {}),
        }
      },
    }),
  ],
})
