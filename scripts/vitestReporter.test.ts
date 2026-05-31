import { describe, expect, it } from 'vitest'
import { createDefaultVitestReporters } from '../test-utils/vitestReporter'

describe('createDefaultVitestReporters', () => {
  it('uses the AI reporter by default', () => {
    const reporters = createDefaultVitestReporters()

    expect(reporters).toHaveLength(1)
    expect(reporters[0]?.constructor.name).toBe('AIReporter')
  })
})
