import type { DungeonTool } from '../../store/useDungeonStore'

export function shouldRunContinuousSceneEffects(
  tool: DungeonTool,
) {
  return tool === 'play'
}
