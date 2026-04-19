import * as THREE from 'three'
import {
  EXPLORED_MEMORY_MASK_LAYER,
  LINE_OF_SIGHT_MASK_LAYER,
} from '../../postprocessing/lineOfSightMask'
import type { PlayVisibilityState } from './playVisibility'

export function setLosLayers(object: THREE.Object3D, visibility: PlayVisibilityState) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    child.layers.disable(LINE_OF_SIGHT_MASK_LAYER)
    child.layers.disable(EXPLORED_MEMORY_MASK_LAYER)

    if (visibility === 'visible') {
      child.layers.enable(LINE_OF_SIGHT_MASK_LAYER)
    } else if (visibility === 'explored') {
      child.layers.enable(EXPLORED_MEMORY_MASK_LAYER)
    }
  })
}
