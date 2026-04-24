import './App.css'
import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Authenticated, Unauthenticated, useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { useViewerIdentity } from './lib/auth'
import { type PlatformRole } from './lib/roles'

function PasswordAuthCard() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await signIn('password', formData)
    } catch (submitError) {
      setError(
        flow === 'signIn'
          ? 'Sign-in failed. If this account does not exist yet, switch to sign up first.'
          : 'Sign-up failed. Make sure the email is valid and the password is at least 8 characters.',
      )
      console.error(submitError)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }

  return (
    <section className="auth-card" aria-labelledby="auth-card-title">
      <div className="auth-card__header">
        <p className="app-shell__eyebrow">Convex Auth</p>
        <h2 className="panel__title" id="auth-card-title">
          Email and password
        </h2>
        <p className="panel__copy">
          Local self-hosted authentication is the first gateway into the signed-in product.
        </p>
      </div>

      <form className="auth-card__form" onSubmit={handleSubmit}>
        <label className="auth-card__field">
          <span>Email</span>
          <input autoComplete="email" name="email" type="email" required />
        </label>

        {flow === 'signUp' ? (
          <label className="auth-card__field">
            <span>Display name</span>
            <input autoComplete="nickname" name="name" type="text" />
          </label>
        ) : null}

        <label className="auth-card__field">
          <span>Password</span>
          <input
            autoComplete={flow === 'signIn' ? 'current-password' : 'new-password'}
            minLength={8}
            name="password"
            type="password"
            required
          />
        </label>

        <input name="flow" type="hidden" value={flow} />

        {error ? <p className="auth-card__error">{error}</p> : null}

        <div className="auth-card__actions">
          <button className="hero-panel__button hero-panel__button--primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Working...' : flow === 'signIn' ? 'Sign in' : 'Create account'}
          </button>
          <button
            className="hero-panel__button hero-panel__button--secondary"
            onClick={() => {
              setError(null)
              setFlow(flow === 'signIn' ? 'signUp' : 'signIn')
            }}
            type="button"
          >
            {flow === 'signIn' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </form>
    </section>
  )
}

function SignedInOverview() {
  const { signOut } = useAuthActions()
  const identity = useViewerIdentity()
  const workspaceMembers = useQuery(
    api.roles.listActiveWorkspaceUsers,
    identity.access.canManageUsers ? {} : 'skip',
  )
  const grantRoleByEmail = useMutation(api.roles.grantRoleByEmail)
  const revokeRoleByEmail = useMutation(api.roles.revokeRoleByEmail)
  const [roleEmail, setRoleEmail] = useState('')
  const [roleToManage, setRoleToManage] = useState<PlatformRole>('player')
  const [roleScope, setRoleScope] = useState<'workspace' | 'global'>('workspace')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [isManagingRoles, setIsManagingRoles] = useState(false)

  const navItems = [
    identity.access.canManageDungeons && { id: 'library', label: 'Dungeon Library' },
    identity.access.canManageSessions && { id: 'sessions', label: 'Sessions' },
    identity.access.canUseCharacterLibrary && { id: 'characters', label: 'Characters' },
    identity.access.canManagePacks && { id: 'admin', label: 'Admin' },
  ].filter((item): item is { id: string; label: string } => Boolean(item))

  async function handleRoleMutation(mode: 'grant' | 'revoke') {
    const normalizedEmail = roleEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      setRoleError('Enter a user email before changing roles.')
      return
    }

    setRoleError(null)
    setIsManagingRoles(true)

    try {
      const payload = {
        email: normalizedEmail,
        role: roleToManage,
        scope: roleScope,
      }

      if (mode === 'grant') {
        await grantRoleByEmail(payload)
      } else {
        await revokeRoleByEmail(payload)
      }
    } catch (mutationError) {
      console.error(mutationError)
      setRoleError(
        mode === 'grant'
          ? 'Role update failed. The target user may not exist yet.'
          : 'Role removal failed. The last global admin cannot remove their own admin access.',
      )
    }

    setIsManagingRoles(false)
  }

  return (
    <>
      <section className="signed-in-card" aria-labelledby="signed-in-title">
        <div>
          <p className="app-shell__eyebrow">Authenticated workspace</p>
          <h2 className="panel__title" id="signed-in-title">
            {identity.viewer?.name ?? identity.viewer?.email ?? 'DungeonPlanner user'}
          </h2>
          <p className="panel__copy">
            Signed into the local Convex-backed shell. Workspace, role, and library records are now
            resolving through Convex instead of the anonymous demo surface.
          </p>
        </div>

        <div className="signed-in-card__meta">
          <div>
            <p className="status-card__label">Workspace</p>
            <p className="status-card__value">{identity.workspace?.name ?? 'Provisioning workspace...'}</p>
          </div>
          <div>
            <p className="status-card__label">Roles</p>
            <div className="role-badges" aria-label="Current roles">
              {identity.roles.length > 0 ? (
                identity.roles.map((role: PlatformRole) => (
                  <span className="role-badge" key={role}>
                    {role}
                  </span>
                ))
              ) : (
                <span className="role-badge role-badge--muted">provisioning</span>
              )}
            </div>
          </div>
          <button className="hero-panel__button hero-panel__button--secondary" onClick={() => void signOut()} type="button">
            Sign out
          </button>
        </div>
      </section>

      <nav className="app-shell__subnav" aria-label="Signed-in modules">
        {navItems.map((item) => (
          <a className="app-shell__nav-link" href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>

      {!identity.access.canManageDungeons &&
      !identity.access.canManageSessions &&
      !identity.access.canManagePacks ? (
        <section className="signed-in-card">
          <div>
            <p className="app-shell__eyebrow">Player access</p>
            <h2 className="panel__title">Limited workspace tooling</h2>
            <p className="panel__copy">
              This account currently resolves as a player-only member. DM and admin tooling stays hidden
              until those roles are assigned in Convex.
            </p>
          </div>
        </section>
      ) : null}

      <section className="panels" id="roadmap" aria-label="Authenticated product modules">
        {identity.access.canManageDungeons ? (
          <article className="panel" id="library">
            <p className="panel__eyebrow">Dungeon Library</p>
            <h2 className="panel__title">Owned maps</h2>
            <p className="panel__copy">Convex list/create plumbing exists for latest-only dungeon records.</p>
            <ul className="panel__list">
              <li>Viewer-scoped dungeon records</li>
              <li>DM-only creation flow</li>
              <li>Load bridge still to be wired</li>
            </ul>
          </article>
        ) : null}

        {identity.access.canManageSessions ? (
          <article className="panel" id="sessions">
            <p className="panel__eyebrow">Sessions</p>
            <h2 className="panel__title">DM-owned play spaces</h2>
            <p className="panel__copy">Session records, join codes, and membership persistence now have a backend home.</p>
            <ul className="panel__list">
              <li>Durable session records</li>
              <li>DM-only session creation</li>
              <li>Colyseus handoff still pending</li>
            </ul>
          </article>
        ) : null}

        {identity.access.canUseCharacterLibrary ? (
          <article className="panel" id="characters">
            <p className="panel__eyebrow">Characters</p>
            <h2 className="panel__title">Player-owned records</h2>
            <p className="panel__copy">Character storage is scaffolded so persistent player identity can move in next.</p>
            <ul className="panel__list">
              <li>Owner-linked character records</li>
              <li>Player or admin accessible</li>
              <li>Session references ready</li>
            </ul>
          </article>
        ) : null}

        {identity.access.canManagePacks ? (
          <article className="panel" id="admin">
            <p className="panel__eyebrow">Admin</p>
            <h2 className="panel__title">Pack governance</h2>
            <p className="panel__copy">Registry records now model visibility, activation, and file references.</p>
            <ul className="panel__list">
              <li>Admin-only pack creation</li>
              <li>Global / public / private</li>
              <li>Workspace-scoped ownership</li>
            </ul>
          </article>
        ) : null}
      </section>

      {identity.access.canManageUsers ? (
        <section className="auth-card" aria-labelledby="role-manager-title">
          <div className="auth-card__header">
            <p className="app-shell__eyebrow">Admin controls</p>
            <h2 className="panel__title" id="role-manager-title">
              Manage workspace roles
            </h2>
            <p className="panel__copy">
              Admins can grant or revoke additive roles by email. Global admin applies across every workspace.
            </p>
          </div>

          <div className="role-manager">
            <label className="auth-card__field">
              <span>User email</span>
              <input
                autoComplete="email"
                onChange={(event) => setRoleEmail(event.target.value)}
                placeholder="player@example.com"
                type="email"
                value={roleEmail}
              />
            </label>

            <label className="auth-card__field">
              <span>Role</span>
              <select
                className="auth-card__select"
                onChange={(event) => setRoleToManage(event.target.value as PlatformRole)}
                value={roleToManage}
              >
                <option value="player">player</option>
                <option value="dm">dm</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <label className="auth-card__field">
              <span>Scope</span>
              <select
                className="auth-card__select"
                disabled={roleToManage === 'admin'}
                onChange={(event) => setRoleScope(event.target.value as 'workspace' | 'global')}
                value={roleToManage === 'admin' ? 'global' : roleScope}
              >
                <option value="workspace">workspace</option>
                <option value="global">global</option>
              </select>
            </label>
          </div>

          {roleError ? <p className="auth-card__error">{roleError}</p> : null}

          <div className="auth-card__actions">
            <button
              className="hero-panel__button hero-panel__button--primary"
              disabled={isManagingRoles}
              onClick={() => void handleRoleMutation('grant')}
              type="button"
            >
              Grant role
            </button>
            <button
              className="hero-panel__button hero-panel__button--secondary"
              disabled={isManagingRoles}
              onClick={() => void handleRoleMutation('revoke')}
              type="button"
            >
              Revoke role
            </button>
          </div>

          <div className="workspace-members">
            <p className="status-card__label">Visible members</p>
            {workspaceMembers && workspaceMembers.length > 0 ? (
              <div className="workspace-members__list">
                {workspaceMembers.map((member: { userId: string; name: string | null; email: string | null; roles: PlatformRole[] }) => (
                  <article className="workspace-member" key={member.userId}>
                    <div>
                      <p className="workspace-member__title">
                        {member.name ?? member.email ?? 'Unnamed user'}
                      </p>
                      <p className="panel__copy">{member.email ?? 'No email on file'}</p>
                    </div>
                    <div className="role-badges">
                      {member.roles.length > 0 ? (
                        member.roles.map((role: PlatformRole) => (
                          <span className="role-badge" key={`${member.userId}-${role}`}>
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="role-badge role-badge--muted">no roles</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="panel__copy">No members are visible in the active workspace yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}

function App() {
  const { isLoading } = useConvexAuth()

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <p className="app-shell__eyebrow">DungeonPlanner App</p>
          <h1 className="app-shell__title">Signed-in product shell</h1>
          <p className="app-shell__subtitle">
            Local-first authenticated workspace for libraries, sessions, characters, and admin tools.
          </p>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          <a className="app-shell__nav-link" href="#hero-title">Overview</a>
          <a className="app-shell__nav-link" href="#auth">Auth</a>
          <a className="app-shell__nav-link" href="#roadmap">Workspace</a>
        </nav>
      </header>

      <main className="app-shell__main">
        <section className="hero-panel" aria-labelledby="hero-title">
          <div className="hero-panel__content">
            <p className="app-shell__eyebrow">Phase one foundation</p>
            <h2 className="hero-panel__title" id="hero-title">
              Build the real product without disturbing the public landing page or demo.
            </h2>
            <p className="hero-panel__copy">
              This workspace is the future signed-in surface. The anonymous demo, docs, and landing
              page stay where they are while Convex auth, libraries, sessions, and pack management
              come online here first.
            </p>
            <div className="hero-panel__actions">
              <a className="hero-panel__button hero-panel__button--primary" href="#auth">
                Auth flow placeholder
              </a>
              <a className="hero-panel__button hero-panel__button--secondary" href="#roadmap">
                Workspace roadmap
              </a>
            </div>
          </div>

          <div className="hero-panel__status">
            <article className="status-card">
              <p className="status-card__label">Auth</p>
              <p className="status-card__value">Convex Auth</p>
              <p className="status-card__copy">Starts here, not in the public site or demo.</p>
            </article>
            <article className="status-card">
              <p className="status-card__label">Persistence</p>
              <p className="status-card__value">Manual saves first</p>
              <p className="status-card__copy">Latest-only dungeon records before version history.</p>
            </article>
            <article className="status-card">
              <p className="status-card__label">Multiplayer</p>
              <p className="status-card__value">Colyseus stays live</p>
              <p className="status-card__copy">Durable identity moves to Convex, live transport stays separate.</p>
            </article>
          </div>
        </section>

        {isLoading ? (
          <section className="signed-in-card signed-in-card--loading" aria-live="polite">
            <div>
              <p className="app-shell__eyebrow">Connecting</p>
              <h2 className="panel__title">Waiting for local Convex auth state...</h2>
              <p className="panel__copy">
                The app is hydrating the current browser session against the self-hosted Convex backend.
              </p>
            </div>
          </section>
        ) : null}

        <Unauthenticated>
          <PasswordAuthCard />
        </Unauthenticated>

        <Authenticated>
          <SignedInOverview />
        </Authenticated>

        <footer className="app-shell__footer" id="auth">
          Local setup target: start self-hosted Convex, set the generated admin key in
          <code>app/.env.local</code>, then run <code>pnpm --filter dungeonplanner-app convex:dev</code>.
        </footer>
      </main>
    </div>
  )
}

export default App
