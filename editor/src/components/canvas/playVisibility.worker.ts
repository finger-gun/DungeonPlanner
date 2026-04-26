import { computeVisibleCellKeysFromInput } from './playVisibilityCore'

self.addEventListener('message', (event) => {
  const { requestId, input } = event.data as {
    requestId: number
    input: Parameters<typeof computeVisibleCellKeysFromInput>[0]
  }

  const visibleCellKeys = computeVisibleCellKeysFromInput(input)
  self.postMessage({ requestId, visibleCellKeys })
})
