import { describe, expect, it } from 'vitest'
import {
  buildConvexEnvFile,
  mergeEnvFile,
  parseAdminKey,
  parseEnvAssignments,
} from './setup-authenticated-app-utils.mjs'

describe('setup-authenticated-app-utils', () => {
  it('parses the self-hosted admin key from script output', () => {
    expect(
      parseAdminKey(`
> dungeonplanner-app@0.0.0 convex:self-hosted:admin-key
Admin key:
convex-self-hosted|abc123def456
`),
    ).toBe('convex-self-hosted|abc123def456')
  })

  it('extracts env assignments from script output', () => {
    expect(
      parseEnvAssignments(`
> dungeonplanner-app@0.0.0 convex:auth:keys
JWT_PRIVATE_KEY="private value"
JWKS={"keys":[]}
`),
    ).toEqual({
      JWT_PRIVATE_KEY: '"private value"',
      JWKS: '{"keys":[]}',
    })
  })

  it('merges managed env values without dropping unrelated ones', () => {
    expect(
      mergeEnvFile(
        'EXISTING_KEY=value\nCONVEX_SELF_HOSTED_ADMIN_KEY=old-key\n',
        {
          CONVEX_SELF_HOSTED_ADMIN_KEY: 'new-key',
          VITE_CONVEX_URL: 'http://127.0.0.1:3210',
        },
      ),
    ).toBe(
      'EXISTING_KEY=value\nCONVEX_SELF_HOSTED_ADMIN_KEY=new-key\nVITE_CONVEX_URL=http://127.0.0.1:3210\n',
    )
  })

  it('builds the env file pushed to Convex', () => {
    expect(
      buildConvexEnvFile('http://localhost:4173', {
        JWT_PRIVATE_KEY: '"private value"',
        JWKS: '{"keys":[]}',
      }),
    ).toBe(
      'SITE_URL=http://localhost:4173\nJWT_PRIVATE_KEY="private value"\nJWKS={"keys":[]}\n',
    )
  })
})
