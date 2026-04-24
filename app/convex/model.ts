import { v } from 'convex/values'
import { platformRoles } from './roleAccess'

export const roleValidator = v.union(
  ...platformRoles.map((role) => v.literal(role)),
)

export const packKindValidator = v.union(v.literal('asset'), v.literal('rules'))

export const packVisibilityValidator = v.union(
  v.literal('global'),
  v.literal('public'),
  v.literal('private'),
)
