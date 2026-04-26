import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const [packageDirArg, modeArg = 'dev', ...rawForwardedArgs] = process.argv.slice(2)

if (!packageDirArg) {
  throw new Error('Expected a package directory argument.')
}

if (modeArg !== 'dev' && modeArg !== 'preview') {
  throw new Error(`Unsupported Vite mode: ${modeArg}`)
}

const packageDir = path.resolve(process.cwd(), packageDirArg)
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const forwardedArgs = rawForwardedArgs[0] === '--' ? rawForwardedArgs.slice(1) : rawForwardedArgs
const viteArgs = modeArg === 'preview' ? ['exec', 'vite', 'preview', ...forwardedArgs] : ['exec', 'vite', ...forwardedArgs]

const child = spawn(pnpmCommand, viteArgs, {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exitCode = code ?? 0
})
