export function getDefaultPlayerAnimationName(animationNames: string[]): string | null {
  if (animationNames.length === 0) {
    return null
  }

  if (animationNames.includes('Idle_A')) {
    return 'Idle_A'
  }

  const nonPoseAnimation = animationNames.find((name) => name !== 'T-Pose')
  return nonPoseAnimation ?? animationNames[0]
}

export function getPlayerAnimationName(
  animationNames: string[],
  animationState: 'default' | 'selected' | 'pickup' | 'holding' | 'release',
): string | null {
  if (animationState === 'pickup') {
    return getNamedAnimation(animationNames, ['Jump_Start', 'Jump_Start.001'])
  }

  if (animationState === 'holding') {
    return getNamedAnimation(animationNames, ['Jump_Idle', 'Jump_Idle.001'])
  }

  if (animationState === 'release') {
    return getNamedAnimation(animationNames, ['Jump_Land', 'Jump_Land.001'])
  }

  return getDefaultPlayerAnimationName(animationNames)
}

export const PLAYER_ANIMATION_MS = {
  pickup: 1000,
  release: 1000,
} as const

function getNamedAnimation(animationNames: string[], candidates: string[]) {
  for (const name of candidates) {
    if (animationNames.includes(name)) {
      return name
    }
  }

  return null
}
