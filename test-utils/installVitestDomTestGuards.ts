import { afterAll, beforeAll, vi } from 'vitest'

type CanvasContextStub = {
  canvas: HTMLCanvasElement
  clearRect: (...args: unknown[]) => void
  fillRect: (...args: unknown[]) => void
  strokeRect: (...args: unknown[]) => void
  beginPath: (...args: unknown[]) => void
  closePath: (...args: unknown[]) => void
  moveTo: (...args: unknown[]) => void
  lineTo: (...args: unknown[]) => void
  arc: (...args: unknown[]) => void
  fill: (...args: unknown[]) => void
  stroke: (...args: unknown[]) => void
  save: (...args: unknown[]) => void
  restore: (...args: unknown[]) => void
  translate: (...args: unknown[]) => void
  rotate: (...args: unknown[]) => void
  scale: (...args: unknown[]) => void
  setTransform: (...args: unknown[]) => void
  resetTransform: (...args: unknown[]) => void
  drawImage: (...args: unknown[]) => void
  putImageData: (...args: unknown[]) => void
  createImageData: (width: number, height: number) => ImageData
  getImageData: (x: number, y: number, width: number, height: number) => ImageData
  createLinearGradient: (...args: unknown[]) => { addColorStop: (...args: unknown[]) => void }
  measureText: (text: string) => { width: number }
  fillText: (...args: unknown[]) => void
  strokeText: (...args: unknown[]) => void
  clip: (...args: unknown[]) => void
  globalAlpha: number
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  font: string
  filter: string
}

const THREE_DUPLICATE_WARNING = 'THREE.WARNING: Multiple instances of Three.js being imported.'

function createCanvasContextStub(canvas: HTMLCanvasElement): CanvasContextStub {
  return {
    canvas,
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    drawImage: () => {},
    putImageData: () => {},
    createImageData: (width, height) => new ImageData(width, height),
    getImageData: (_x, _y, width, height) => new ImageData(width, height),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    measureText: (text) => ({ width: text.length * 8 }),
    fillText: () => {},
    strokeText: () => {},
    clip: () => {},
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px sans-serif',
    filter: 'none',
  }
}

function isFilteredConsoleWarning(value: unknown) {
  return typeof value === 'string' && value.includes(THREE_DUPLICATE_WARNING)
}

export function installVitestDomTestGuards() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext(
      this: HTMLCanvasElement,
      type,
    ) {
      if (type === '2d') {
        return createCanvasContextStub(this) as unknown as CanvasRenderingContext2D
      }

      return originalGetContext.call(this, type)
    })

    vi.spyOn(console, 'warn').mockImplementation((...args: Parameters<typeof console.warn>) => {
      if (args.some(isFilteredConsoleWarning)) {
        return
      }

      originalConsoleWarn(...args)
    })

    vi.spyOn(console, 'error').mockImplementation((...args: Parameters<typeof console.error>) => {
      if (args.some(isFilteredConsoleWarning)) {
        return
      }

      originalConsoleError(...args)
    })
  })

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
    vi.restoreAllMocks()
  })
}
