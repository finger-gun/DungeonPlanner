/**
 * FogOfWar — instanced fog overlay on the grid.
 * - DM: sees everything (renders nothing)
 * - Players: cells outside PLAYER entity LoS are fully dark (undiscovered)
 *   or dimmed (discovered but not currently visible)
 *
 * Discovery is accumulated client-side and never resets during a session.
 * The overlay sits above FloorGridOverlay and below props/walls.
 */
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  useMultiplayerStore,
  useIsDM,
  getCellsInRadius,
  FOG_REVEAL_RADIUS,
} from '../../multiplayer/useMultiplayerStore'
import { useDungeonStore } from '../../store/useDungeonStore'
import { cellToWorldPosition, getCellKey, GRID_SIZE } from '../../hooks/useSnapToGrid'

// Sits just above the grid overlay
const FOG_Y = 0.30
const MAX_FOG_INSTANCES = 8192

export function FogOfWar() {
  const isDM = useIsDM()

  if (isDM) return null
  return <FogLayer />
}

function FogLayer() {
  const entities      = useMultiplayerStore((s) => s.entities)
  const discoveredCells = useMultiplayerStore((s) => s.discoveredCells)
  const discoverCells = useMultiplayerStore((s) => s.discoverCells)
  const paintedCells  = useDungeonStore((s) => s.paintedCells)

  // Discover cells around PLAYER entities whenever their positions change
  useEffect(() => {
    const playerEntities = Object.values(entities).filter((e) => e.type === 'PLAYER')
    for (const e of playerEntities) {
      discoverCells(getCellsInRadius(e.cellX, e.cellZ, FOG_REVEAL_RADIUS))
    }
  }, [entities, discoverCells])

  // Build sorted lists of painted cells grouped by fog state
  const { undiscovered, dimmed } = useMemo(() => {
    const playerEntities = Object.values(entities).filter((e) => e.type === 'PLAYER')

    // Build currently visible set
    const currentlyVisible = new Set<string>()
    for (const e of playerEntities) {
      for (const k of getCellsInRadius(e.cellX, e.cellZ, FOG_REVEAL_RADIUS)) {
        currentlyVisible.add(k)
      }
    }

    const undiscovered: THREE.Vector3[] = []
    const dimmed: THREE.Vector3[] = []

    for (const record of Object.values(paintedCells)) {
      const key = getCellKey(record.cell)
      const [wx, , wz] = cellToWorldPosition(record.cell)
      const pos = new THREE.Vector3(wx, FOG_Y, wz)

      if (currentlyVisible.has(key)) continue        // fully visible — no fog
      if (discoveredCells.has(key)) dimmed.push(pos)  // seen before — dim fog
      else undiscovered.push(pos)                     // never seen — full fog
    }

    return { undiscovered, dimmed }
  }, [entities, paintedCells, discoveredCells])

  // Geometry: one plane per cell
  const cellGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  const darkMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: '#0a0908', transparent: true, opacity: 0.97, depthWrite: false })
    return m
  }, [])

  const dimMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: '#0a0908', transparent: true, opacity: 0.55, depthWrite: false })
    return m
  }, [])

  const darkRef = useRef<THREE.InstancedMesh>(null)
  const dimRef  = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  // Update instance matrices when fog sets change
  useEffect(() => {
    const darkMesh = darkRef.current
    if (!darkMesh) return
    undiscovered.forEach((pos, i) => {
      dummy.position.copy(pos)
      dummy.updateMatrix()
      darkMesh.setMatrixAt(i, dummy.matrix)
    })
    darkMesh.count = undiscovered.length
    darkMesh.instanceMatrix.needsUpdate = true
  }, [undiscovered, dummy])

  useEffect(() => {
    const dimMesh = dimRef.current
    if (!dimMesh) return
    dimmed.forEach((pos, i) => {
      dummy.position.copy(pos)
      dummy.updateMatrix()
      dimMesh.setMatrixAt(i, dummy.matrix)
    })
    dimMesh.count = dimmed.length
    dimMesh.instanceMatrix.needsUpdate = true
  }, [dimmed, dummy])

  return (
    <>
      {/* Undiscovered: nearly opaque black */}
      <instancedMesh
        ref={darkRef}
        args={[cellGeo, darkMat, MAX_FOG_INSTANCES]}
        frustumCulled={false}
        renderOrder={3}
      />
      {/* Discovered but not visible: semi-transparent dark */}
      <instancedMesh
        ref={dimRef}
        args={[cellGeo, dimMat, MAX_FOG_INSTANCES]}
        frustumCulled={false}
        renderOrder={4}
      />
    </>
  )
}
