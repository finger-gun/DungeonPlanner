import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../rendering/nodeMaterialUtils'
import type {
  AtlasColorVariantDefinition,
  ContentPackComponentProps,
  ContentPackModelTransform,
} from '../types'

const UV_EPSILON = 0.0001

export type AtlasCell = readonly [number, number]
export type AtlasColorSwatchVariant = AtlasColorVariantDefinition & { cell: AtlasCell }

export function buildAtlasColorVariants({
  columns,
  rows,
  excludedCells = [],
  namedVariantsByCell = {},
  swatchColorsTopOrigin,
}: {
  columns: number
  rows: number
  excludedCells?: AtlasCell[]
  namedVariantsByCell?: Record<string, { id: string; label: string }>
  swatchColorsTopOrigin: readonly (readonly string[])[]
}) {
  const excludedCellKeys = new Set(excludedCells.map(getAtlasCellKey))
  const variants: AtlasColorSwatchVariant[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cell: AtlasCell = [column, row]
      if (excludedCellKeys.has(getAtlasCellKey(cell))) {
        continue
      }

      const namedVariant = namedVariantsByCell[getAtlasCellKey(cell)]
      variants.push({
        id: namedVariant?.id ?? `swatch-${row}-${column}`,
        label: namedVariant?.label ?? `Swatch ${variants.length + 1}`,
        swatchColor: getAtlasSwatchColorForCell(cell, rows, swatchColorsTopOrigin),
        uvOffset: [0, 0] as const,
        cell,
      })
    }
  }

  return variants
}

export function createAtlasColorVariantModelComponent({
  assetUrl,
  transform,
  sourceCells,
  variants,
  propKey,
  defaultVariantId,
  grid,
}: {
  assetUrl: string
  transform: ContentPackModelTransform
  sourceCells: AtlasCell[]
  variants: AtlasColorSwatchVariant[]
  propKey: string
  defaultVariantId: string
  grid: { columns: number; rows: number }
}) {
  useGLTF.preload(assetUrl)

  function AtlasColorVariantModel(props: ContentPackComponentProps) {
    const selectedVariant = resolveAtlasColorSwatchVariant(
      props.objectProps?.[propKey],
      defaultVariantId,
      variants,
    )
    const selectedCell = selectedVariant.cell
    const gltf = useGLTF(assetUrl)
    const scene = useMemo(() => {
      const clone = cloneSceneWithNodeMaterials(gltf.scene)
      remapSceneUvCells(clone, sourceCells, selectedCell, grid)
      return clone
    }, [gltf.scene, selectedCell])

    return (
      <group {...props}>
        <group
          position={transform.position}
          rotation={transform.rotation}
          scale={transform.scale}
        >
          <primitive object={scene} />
        </group>
      </group>
    )
  }

  return AtlasColorVariantModel
}

export function remapSceneUvCells(
  root: THREE.Object3D,
  sourceCells: AtlasCell[],
  targetCell: AtlasCell,
  grid: { columns: number; rows: number },
) {
  if (sourceCells.some((cell) => cell[0] === targetCell[0] && cell[1] === targetCell[1])) {
    return
  }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.geometry instanceof THREE.BufferGeometry)) {
      return
    }

    const sourceGeometry = child.geometry
    const sourceUv = sourceGeometry.getAttribute('uv')
    if (!(sourceUv instanceof THREE.BufferAttribute)) {
      return
    }

    const nextGeometry = sourceGeometry.clone()
    const nextUv = nextGeometry.getAttribute('uv')
    if (!(nextUv instanceof THREE.BufferAttribute)) {
      child.geometry = nextGeometry
      return
    }

    remapUvCells(nextUv, sourceCells, targetCell, grid)
    nextUv.needsUpdate = true
    child.geometry = nextGeometry
  })
}

export function remapUvCells(
  uv: THREE.BufferAttribute,
  sourceCells: AtlasCell[],
  targetCell: AtlasCell,
  grid: { columns: number; rows: number },
) {
  const cellWidth = 1 / grid.columns
  const cellHeight = 1 / grid.rows
  const targetMinU = targetCell[0] * cellWidth
  const targetMinV = targetCell[1] * cellHeight

  for (let index = 0; index < uv.count; index += 1) {
    const currentU = uv.getX(index)
    const currentV = uv.getY(index)

    for (const sourceCell of sourceCells) {
      const sourceMinU = sourceCell[0] * cellWidth
      const sourceMinV = sourceCell[1] * cellHeight

      if (
        currentU < sourceMinU - UV_EPSILON ||
        currentU > sourceMinU + cellWidth + UV_EPSILON ||
        currentV < sourceMinV - UV_EPSILON ||
        currentV > sourceMinV + cellHeight + UV_EPSILON
      ) {
        continue
      }

      uv.setXY(
        index,
        targetMinU + (currentU - sourceMinU),
        targetMinV + (currentV - sourceMinV),
      )
      break
    }
  }
}

export function resolveAtlasColorSwatchVariant(
  rawValue: unknown,
  defaultVariantId: string,
  variants: AtlasColorSwatchVariant[],
) {
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase()
    const matched = variants.find((variant) => variant.id === normalized)
    if (matched) {
      return matched
    }
  }

  return variants.find((variant) => variant.id === defaultVariantId) ?? variants[0]!
}

export function getAtlasSwatchColorForCell(
  cell: AtlasCell,
  _rows: number,
  swatchColorsTopOrigin: readonly (readonly string[])[],
) {
  return swatchColorsTopOrigin[cell[1]]?.[cell[0]] ?? '#9ca3af'
}

export function getAtlasCellKey(cell: AtlasCell) {
  return `${cell[0]}:${cell[1]}`
}
