import { describe, expect, it } from 'vitest'
import {
  getBootstrapPythonCandidates,
  getCharacterGeneratorPaths,
  normalizeForwardedArgs,
  shouldInstallCharacterGenerator,
} from './run-character-generator-utils.mjs'

describe('run-character-generator-utils', () => {
  it('strips the pnpm argument separator before forwarding args', () => {
    expect(normalizeForwardedArgs(['--', '--config-file', './examples/config.yaml'])).toEqual([
      '--config-file',
      './examples/config.yaml',
    ])
    expect(normalizeForwardedArgs(['--help'])).toEqual(['--help'])
  })

  it('resolves platform-specific virtualenv paths', () => {
    expect(getCharacterGeneratorPaths('/repo').venvPythonPath).toBe(
      '/repo/tools/character-generator/.venv/bin/python',
    )
    expect(getCharacterGeneratorPaths('/repo', 'win32').venvPythonPath).toBe(
      '/repo/tools/character-generator/.venv/Scripts/python.exe',
    )
  })

  it('requires install when the stamp is missing or pyproject changed', () => {
    expect(shouldInstallCharacterGenerator(null, 10)).toBe(true)
    expect(shouldInstallCharacterGenerator({ pyprojectMtimeMs: 10 }, 10)).toBe(false)
    expect(shouldInstallCharacterGenerator({ pyprojectMtimeMs: 9 }, 10)).toBe(true)
  })

  it('prefers platform-appropriate bootstrap python commands', () => {
    expect(getBootstrapPythonCandidates('darwin')).toEqual([
      { command: 'python3.11', args: [], label: 'python3.11' },
      { command: 'python3.12', args: [], label: 'python3.12' },
      { command: 'python3.13', args: [], label: 'python3.13' },
      { command: 'python3', args: [], label: 'python3' },
      { command: 'python', args: [], label: 'python' },
    ])
    expect(getBootstrapPythonCandidates('win32')).toEqual([
      { command: 'py', args: ['-3.11'], label: 'py -3.11' },
      { command: 'py', args: ['-3.12'], label: 'py -3.12' },
      { command: 'py', args: ['-3.13'], label: 'py -3.13' },
      { command: 'python', args: [], label: 'python' },
      { command: 'python3', args: [], label: 'python3' },
    ])
  })
})
