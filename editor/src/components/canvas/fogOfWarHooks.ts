import { createContext, useContext } from 'react'
import type { FogOfWarRuntime } from './fogOfWarShared'

export const FogOfWarContext = createContext<FogOfWarRuntime | null>(null)

export function useFogOfWarRuntime() {
  return useContext(FogOfWarContext)
}
