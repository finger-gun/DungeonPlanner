import { useEffect, useRef } from 'react'

function getRangeInputFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null
  }

  const rangeInput = target.closest('input[type="range"]')
  return rangeInput instanceof HTMLInputElement ? rangeInput : null
}

export function useBlurPointerRangeInputOnRelease() {
  const trackedRangeInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const clearTrackedRangeInput = () => {
      trackedRangeInputRef.current = null
    }

    const blurTrackedRangeInput = () => {
      const trackedRangeInput = trackedRangeInputRef.current
      trackedRangeInputRef.current = null

      if (trackedRangeInput && document.activeElement === trackedRangeInput) {
        trackedRangeInput.blur()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      trackedRangeInputRef.current = getRangeInputFromTarget(event.target)
    }

    const handleChange = (event: Event) => {
      const changedRangeInput = getRangeInputFromTarget(event.target)
      if (changedRangeInput && changedRangeInput === trackedRangeInputRef.current) {
        blurTrackedRangeInput()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('pointerup', blurTrackedRangeInput, true)
    document.addEventListener('pointercancel', clearTrackedRangeInput, true)
    document.addEventListener('change', handleChange, true)
    window.addEventListener('blur', clearTrackedRangeInput)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('pointerup', blurTrackedRangeInput, true)
      document.removeEventListener('pointercancel', clearTrackedRangeInput, true)
      document.removeEventListener('change', handleChange, true)
      window.removeEventListener('blur', clearTrackedRangeInput)
    }
  }, [])
}
