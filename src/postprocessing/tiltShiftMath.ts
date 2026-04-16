export const TILT_SHIFT_FOCUS_SAMPLE_XS = [0.38, 0.5, 0.62] as const

export function depthFocusRangeFromFocalLength(focalLength: number) {
  return Math.max(0.015, focalLength / 30)
}
