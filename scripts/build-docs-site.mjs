import { mkdir, readdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const docsSourceDir = path.join(rootDir, 'docs')
const docsOutDir = path.join(rootDir, 'dist', 'docs')

const DOC_FILE_ORDER = [
  'index.md',
  'players.md',
  'game-masters.md',
  'developers.md',
  'ui.md',
  'content-packs.md',
  'architecture.md',
  'store.md',
  'rendering.md',
  'file-format.md',
]

const DOC_TITLES = {
  'index.md': 'Documentation Home',
  'players.md': 'Player Guide',
  'game-masters.md': 'Game Master Guide',
  'developers.md': 'Developer Guide',
  'ui.md': 'Editor UI',
  'content-packs.md': 'Content Packs',
  'architecture.md': 'Architecture',
  'store.md': 'State and Store',
  'rendering.md': 'Rendering',
  'file-format.md': 'File Format',
}

const docsIndexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/docs/" />
    <title>DungeonPlanner Docs</title>
    <meta name="description" content="DungeonPlanner documentation for players, game masters, and developers." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      :root {
        --theme-color: #f59e0b;
      }
      .cover-main > p:last-child a {
        border-color: var(--theme-color) !important;
        color: var(--theme-color) !important;
      }
      .cover-main > p:last-child a:last-child {
        background: var(--theme-color) !important;
        color: #111827 !important;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.$docsify = {
        name: 'DungeonPlanner Docs',
        repo: 'https://github.com/finger-gun/DungeonPlanner',
        basePath: '/docs/',
        loadSidebar: '_sidebar.md',
        homepage: 'index.md',
        relativePath: true,
        auto2top: true,
        maxLevel: 3,
        subMaxLevel: 2,
        themeColor: '#f59e0b',
      };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/docsify@4/lib/docsify.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/docsify@4/lib/plugins/search.min.js"></script>
  </body>
</html>
`

function buildSidebar() {
  const lines = ['# DungeonPlanner Docs', '', '- [Home](index.md)']
  for (const filename of DOC_FILE_ORDER) {
    if (filename === 'index.md') continue
    const title = DOC_TITLES[filename] ?? filename.replace('.md', '')
    lines.push(`- [${title}](${filename})`)
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  await mkdir(path.join(rootDir, 'dist'), { recursive: true })
  await rm(docsOutDir, { recursive: true, force: true })
  await mkdir(docsOutDir, { recursive: true })

  const docsFiles = await readdir(docsSourceDir)
  for (const filename of docsFiles) {
    const sourcePath = path.join(docsSourceDir, filename)
    const targetPath = path.join(docsOutDir, filename)
    if (filename.endsWith('.md') || filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.svg')) {
      await copyFile(sourcePath, targetPath)
    }
  }

  await writeFile(path.join(docsOutDir, 'index.html'), docsIndexHtml, 'utf8')
  await writeFile(path.join(docsOutDir, '_sidebar.md'), buildSidebar(), 'utf8')

  // Ensure docs home markdown has a small banner when opened via docs site.
  const indexPath = path.join(docsOutDir, 'index.md')
  const indexContents = await readFile(indexPath, 'utf8')
  if (!indexContents.includes('Live app:')) {
    const banner = [
      '> Live app: https://demo.dungeonplanner.com/',
      '> ',
      '> Looking for project README? See: https://github.com/finger-gun/DungeonPlanner',
      '',
    ].join('\n')
    await writeFile(indexPath, `${banner}${indexContents}`, 'utf8')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
