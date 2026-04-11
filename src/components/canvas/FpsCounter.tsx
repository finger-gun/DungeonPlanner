import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Module-level ref so the R3F node can update the DOM span without prop drilling
// across the Canvas boundary.
const spanRef = { current: null as HTMLSpanElement | null }

/** Drop inside <Canvas> / GlobalContent to drive the counter. */
export function FpsMeterNode() {
  const frames = useRef(0)
  const last = useRef(performance.now())

  useFrame(() => {
    frames.current++
    const now = performance.now()
    const elapsed = now - last.current
    if (elapsed >= 500 && spanRef.current) {
      spanRef.current.textContent = `${Math.round((frames.current * 1000) / elapsed)} fps`
      frames.current = 0
      last.current = now
    }
  })

  return null
}

/** Render outside <Canvas> in the viewport shell. */
export function FpsOverlay() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 select-none">
      <span
        ref={(el) => { spanRef.current = el }}
        className="font-mono text-[11px] tabular-nums text-stone-600/70"
      />
    </div>
  )
}
