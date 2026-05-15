import type { ReactNode } from 'react'
import { Bvh } from '@react-three/drei'

export function WorldRaycastAcceleration({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Bvh enabled firstHitOnly={true}>
      {children}
    </Bvh>
  )
}
