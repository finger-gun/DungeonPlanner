type HoverPoint = { x: number; y: number; z: number } | null

type InspectionHit = {
  position: [number, number, number]
  normal: [number, number, number]
} | null

const CURSOR_LIGHT_HOVER_OFFSET = 1.5
const CURSOR_LIGHT_SURFACE_OFFSET = 0.65
const CURSOR_LIGHT_HIDDEN_POSITION: [number, number, number] = [0, -1000, 0]
const CURSOR_LIGHT_COLOR = '#ffb15c'
const CURSOR_LIGHT_INTENSITY = 6.5
const CURSOR_LIGHT_DISTANCE = 10.5

export function getCursorInspectionLightPosition(
  hoveredPoint: HoverPoint,
  hoveredInspectionHit: InspectionHit,
): [number, number, number] | null {
  if (hoveredInspectionHit) {
    return [
      hoveredInspectionHit.position[0] + (hoveredInspectionHit.normal[0] * CURSOR_LIGHT_SURFACE_OFFSET),
      hoveredInspectionHit.position[1] + (hoveredInspectionHit.normal[1] * CURSOR_LIGHT_SURFACE_OFFSET),
      hoveredInspectionHit.position[2] + (hoveredInspectionHit.normal[2] * CURSOR_LIGHT_SURFACE_OFFSET),
    ]
  }

  if (!hoveredPoint) {
    return null
  }

  return [
    hoveredPoint.x,
    hoveredPoint.y + CURSOR_LIGHT_HOVER_OFFSET,
    hoveredPoint.z,
  ]
}

export function CursorInspectionLight({
  hoveredPoint,
  hoveredInspectionHit,
}: {
  hoveredPoint: HoverPoint
  hoveredInspectionHit: InspectionHit
}) {
  const position = getCursorInspectionLightPosition(hoveredPoint, hoveredInspectionHit)

  return (
    <pointLight
      color={CURSOR_LIGHT_COLOR}
      intensity={position ? CURSOR_LIGHT_INTENSITY : 0}
      distance={CURSOR_LIGHT_DISTANCE}
      decay={2}
      position={position ?? CURSOR_LIGHT_HIDDEN_POSITION}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-near={0.1}
      shadow-camera-far={14}
      shadow-bias={-0.0015}
      shadow-normalBias={0.02}
    />
  )
}
