import * as THREE from 'three'

export type ForwardPlusLightRecord = {
  key: string
  position: [number, number, number]
  color: string
  intensity: number
  distance: number
  decay: number
}

export type ForwardPlusPointLightLike = {
  isPointLight: true
  matrixWorld: THREE.Matrix4
  color: THREE.Color
  intensity: number
  distance: number
  decay: number
}

class ForwardPlusPointLightProxy implements ForwardPlusPointLightLike {
  readonly isPointLight = true as const
  readonly matrixWorld = new THREE.Matrix4()
  readonly color = new THREE.Color()
  intensity = 0
  distance = 0
  decay = 2

  apply(record: ForwardPlusLightRecord) {
    this.matrixWorld.makeTranslation(...record.position)
    this.color.set(record.color)
    this.intensity = record.intensity
    this.distance = record.distance
    this.decay = record.decay
  }
}

type ForwardPlusLightGroupState = {
  lights: ForwardPlusPointLightProxy[]
  records: ForwardPlusLightRecord[]
}

function cloneLightRecord(record: ForwardPlusLightRecord): ForwardPlusLightRecord {
  return {
    ...record,
    position: [...record.position] as [number, number, number],
  }
}

function areLightRecordsEqual(left: ForwardPlusLightRecord[], right: ForwardPlusLightRecord[]) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftRecord = left[index]
    const rightRecord = right[index]

    if (
      leftRecord.key !== rightRecord.key
      || leftRecord.color !== rightRecord.color
      || leftRecord.intensity !== rightRecord.intensity
      || leftRecord.distance !== rightRecord.distance
      || leftRecord.decay !== rightRecord.decay
      || leftRecord.position[0] !== rightRecord.position[0]
      || leftRecord.position[1] !== rightRecord.position[1]
      || leftRecord.position[2] !== rightRecord.position[2]
    ) {
      return false
    }
  }

  return true
}

export class ForwardPlusLightRegistry {
  private readonly groups = new Map<string, ForwardPlusLightGroupState>()
  private readonly aggregatedLights: ForwardPlusPointLightLike[] = []
  private version = 0
  private aggregatedDirty = false

  getVersion() {
    return this.version
  }

  getLights() {
    if (this.aggregatedDirty) {
      this.aggregatedLights.length = 0
      this.groups.forEach((group) => {
        this.aggregatedLights.push(...group.lights)
      })
      this.aggregatedDirty = false
    }

    return this.aggregatedLights
  }

  setGroupLights(groupId: string, records: ForwardPlusLightRecord[]) {
    const nextRecords = records.map(cloneLightRecord)
    const existing = this.groups.get(groupId)

    if (existing && areLightRecordsEqual(existing.records, nextRecords)) {
      return
    }

    const group = existing ?? { lights: [], records: [] }

    while (group.lights.length < nextRecords.length) {
      group.lights.push(new ForwardPlusPointLightProxy())
    }

    group.lights.length = nextRecords.length
    group.records = nextRecords
    nextRecords.forEach((record, index) => {
      group.lights[index].apply(record)
    })

    this.groups.set(groupId, group)
    this.version += 1
    this.aggregatedDirty = true
  }

  clearGroup(groupId: string) {
    if (!this.groups.delete(groupId)) {
      return
    }

    this.version += 1
    this.aggregatedDirty = true
  }
}

export const forwardPlusLightRegistry = new ForwardPlusLightRegistry()
