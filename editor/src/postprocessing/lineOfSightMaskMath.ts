export function resolveLineOfSightAlpha(
  _baseAlpha: number,
  visibleAlpha: number,
  exploredAlpha: number,
) {
  return Math.max(visibleAlpha, exploredAlpha)
}
