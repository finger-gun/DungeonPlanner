export function parseAdminKey(output) {
  const match = output.match(/convex-self-hosted\|[A-Za-z0-9]+/)

  if (!match) {
    throw new Error('Could not parse the Convex self-hosted admin key from command output.')
  }

  return match[0]
}

export function parseEnvAssignments(output) {
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const separatorIndex = line.indexOf('=')
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
      }),
  )
}

export function mergeEnvFile(existingContent, updates) {
  const lines = existingContent ? existingContent.split(/\r?\n/).filter((line, index, source) => !(index === source.length - 1 && line === '')) : []
  const pendingEntries = new Map(Object.entries(updates))
  const mergedLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)

    if (!match) {
      return line
    }

    const key = match[1]

    if (!pendingEntries.has(key)) {
      return line
    }

    const value = pendingEntries.get(key)
    pendingEntries.delete(key)
    return `${key}=${value}`
  })

  for (const [key, value] of pendingEntries) {
    mergedLines.push(`${key}=${value}`)
  }

  return `${mergedLines.join('\n')}\n`
}

export function buildConvexEnvFile(siteUrl, assignments) {
  const lines = [`SITE_URL=${siteUrl}`]

  for (const [key, value] of Object.entries(assignments)) {
    lines.push(`${key}=${value}`)
  }

  return `${lines.join('\n')}\n`
}
