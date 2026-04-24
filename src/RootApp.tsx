import { Suspense, lazy } from 'react'

const App = lazy(() => import('./App'))
const ThumbnailRendererApp = lazy(() => import('./ThumbnailRendererApp'))

export default function RootApp() {
  const params = new URLSearchParams(window.location.search)
  const isThumbnailRenderer = params.get('thumbnail-renderer') === '1'

  return (
    <Suspense fallback={null}>
      {isThumbnailRenderer ? <ThumbnailRendererApp /> : <App />}
    </Suspense>
  )
}
