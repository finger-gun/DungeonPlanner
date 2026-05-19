import '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
    type IntrinsicElements = ThreeElements
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    type IntrinsicElements = ThreeElements
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    type IntrinsicElements = ThreeElements
  }
}

declare global {
  const __PROJECT_ROOT__: string
}
