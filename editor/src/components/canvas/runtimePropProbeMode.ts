import type { DungeonTool } from '../../store/useDungeonStore'

export function shouldUseRuntimePropProbe(_options: {
  tool: DungeonTool
  showPropProbeDebug?: boolean
}) {
  return true
}
