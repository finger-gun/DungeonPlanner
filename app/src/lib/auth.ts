import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useViewerIdentity() {
  const viewerContext = useQuery(api.users.viewerContext)
  const initializeViewer = useMutation(api.users.initializeViewer)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!viewerContext?.viewer || bootstrappedRef.current) {
      return
    }

    bootstrappedRef.current = true
    void initializeViewer()
  }, [initializeViewer, viewerContext])

  return {
    viewer: viewerContext?.viewer ?? null,
    workspace: viewerContext?.workspace ?? null,
    roles: viewerContext?.roles ?? [],
    access: viewerContext?.access ?? {
      isAdmin: false,
      canManageUsers: false,
      canManagePacks: false,
      canManageDungeons: false,
      canManageSessions: false,
      canUseCharacterLibrary: false,
    },
  }
}
