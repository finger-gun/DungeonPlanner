import type { PlayVisibilityState } from './playVisibility'

export function shouldRenderLineOfSightGeometry(
  visibilityState: PlayVisibilityState,
  _useLineOfSightPostMask: boolean,
): boolean {
  return visibilityState !== 'hidden'
}

export function shouldRenderLineOfSightLight(
  visibilityState: PlayVisibilityState,
  _useLineOfSightPostMask: boolean,
) {
  return visibilityState === 'visible'
}
