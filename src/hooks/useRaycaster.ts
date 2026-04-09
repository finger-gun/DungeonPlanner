import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'

export function useRaycaster(planeY = 0) {
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY))

  useEffect(() => {
    planeRef.current.set(new THREE.Vector3(0, 1, 0), -planeY)
  }, [planeY])

  return {
    pointOnPlane(event: ThreeEvent<PointerEvent>) {
      return event.point.clone()
    },
    objectIdFromEvent(event: ThreeEvent<PointerEvent>) {
      for (const intersection of event.intersections) {
        const objectId = intersection.object.userData.objectId

        if (typeof objectId === 'string') {
          return objectId
        }
      }

      return null
    },
  }
}
