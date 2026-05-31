import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const [packageDirArg, ...forwardedArgs] = process.argv.slice(2)

if (!packageDirArg) {
  throw new Error('Expected a package directory argument.')
}

const packageDir = path.resolve(process.cwd(), packageDirArg)
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const filteredWarningPatterns = [
  /--localstorage-file.*valid path/,
  /\(Use `node --trace-warnings .* warning was created\)/,
  /THREE\.WARNING: Multiple instances of Three\.js being imported\./,
  /Not implemented: HTMLCanvasElement's getContext\(\) method: without installing the canvas npm package/,
]

function sanitizeNodeOptions(nodeOptions) {
  if (!nodeOptions) {
    return undefined
  }

  const tokens = nodeOptions.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
  const sanitizedTokens = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) {
      continue
    }

    if (token === '--localstorage-file') {
      index += 1
      continue
    }

    if (token.startsWith('--localstorage-file=')) {
      continue
    }

    sanitizedTokens.push(token)
  }

  return sanitizedTokens.length > 0 ? sanitizedTokens.join(' ') : undefined
}

const child = spawn(pnpmCommand, ['exec', 'vitest', ...forwardedArgs], {
  cwd: packageDir,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_OPTIONS: sanitizeNodeOptions(process.env.NODE_OPTIONS),
    NODE_NO_WARNINGS: '1',
  },
})

function shouldSuppressLine(line) {
  return filteredWarningPatterns.some((pattern) => pattern.test(line))
}

function pipeFilteredOutput(stream, write) {
  let buffer = ''

  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!shouldSuppressLine(line)) {
        write(`${line}\n`)
      }
    }
  })

  stream.on('end', () => {
    if (buffer && !shouldSuppressLine(buffer)) {
      write(buffer)
    }
  })
}

pipeFilteredOutput(child.stdout, (value) => process.stdout.write(value))
pipeFilteredOutput(child.stderr, (value) => process.stderr.write(value))

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exitCode = code ?? 0
})
