import path from 'node:path'

export function normalizeForwardedArgs(rawArgs) {
  return rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs
}

export function getBootstrapPythonCandidates(platform = process.platform) {
  if (platform === 'win32') {
    return [
      { command: 'py', args: ['-3.11'], label: 'py -3.11' },
      { command: 'py', args: ['-3.12'], label: 'py -3.12' },
      { command: 'py', args: ['-3.13'], label: 'py -3.13' },
      { command: 'python', args: [], label: 'python' },
      { command: 'python3', args: [], label: 'python3' },
    ]
  }

  return [
    { command: 'python3.11', args: [], label: 'python3.11' },
    { command: 'python3.12', args: [], label: 'python3.12' },
    { command: 'python3.13', args: [], label: 'python3.13' },
    { command: 'python3', args: [], label: 'python3' },
    { command: 'python', args: [], label: 'python' },
  ]
}

export function getCharacterGeneratorPaths(rootDir, platform = process.platform) {
  const toolDir = path.join(rootDir, 'tools', 'character-generator')
  const venvDir = path.join(toolDir, '.venv')
  const venvPythonPath = platform === 'win32'
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python')

  return {
    toolDir,
    venvDir,
    venvPythonPath,
    pyprojectPath: path.join(toolDir, 'pyproject.toml'),
    installStampPath: path.join(venvDir, '.install-stamp.json'),
  }
}

export function shouldInstallCharacterGenerator(stampData, pyprojectMtimeMs) {
  if (!stampData || typeof stampData.pyprojectMtimeMs !== 'number') {
    return true
  }

  return stampData.pyprojectMtimeMs !== pyprojectMtimeMs
}
