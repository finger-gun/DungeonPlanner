import type { PlayVisibilityState } from './playVisibility'

export function shouldRenderLineOfSightGeometry(
  visibilityState: PlayVisibilityState,
  useLineOfSightPostMask: boolean,
): boolean {
  return !useLineOfSightPostMask || visibilityState !== 'hidden'
}

export function shouldRenderLineOfSightLight(
  visibilityState: PlayVisibilityState,
  useLineOfSightPostMask: boolean,
) {
  return useLineOfSightPostMask || visibilityState === 'visible'
}
