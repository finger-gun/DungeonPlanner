export type AutofocusPoint = {
  x: number
  y: number
  z: number
} | null

export function resolveAutofocusTarget(
  preferOrbitTarget: boolean,
  orbitTarget: AutofocusPoint,
  raycastTarget: AutofocusPoint,
) {
  return preferOrbitTarget ? (orbitTarget ?? raycastTarget) : (raycastTarget ?? orbitTarget)
}
