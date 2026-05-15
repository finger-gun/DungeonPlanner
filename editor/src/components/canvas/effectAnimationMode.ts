import type { DungeonTool } from '../../store/useDungeonStore'

export function shouldRunContinuousFireParticles(buildAnimationsActive: boolean) {
  return !buildAnimationsActive
}

export function shouldRunContinuousSceneEffects(
  tool: DungeonTool,
  buildAnimationsActive: boolean,
) {
  return tool === 'play' && !buildAnimationsActive
}
