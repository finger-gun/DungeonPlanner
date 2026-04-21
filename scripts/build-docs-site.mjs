import { mkdir, readdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const docsSourceDir = path.join(rootDir, 'docs')
const docsWebDir = path.join(rootDir, 'docs-web')
const docsOutDir = path.join(docsWebDir, 'dist')
const GA_MEASUREMENT_ID = 'G-4TZCSBF6LN'

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
    <title>DungeonPlanner Docs</title>
    <meta name="description" content="DungeonPlanner documentation for players, game masters, and developers." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css" />
    <style>
      :root {
        --theme-color: #f59e0b;
      }
      body {
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }
      .cover-main > p:last-child a {
        border-color: var(--theme-color) !important;
        color: var(--theme-color) !important;
      }
      .cover-main > p:last-child a:last-child {
        background: var(--theme-color) !important;
        color: #111827 !important;
      }
      .cookie-consent-banner {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 2147483000;
        background: rgba(15, 18, 25, 0.96);
        color: #e2e8f0;
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 18px 50px rgba(2, 6, 23, 0.5);
      }
      .cookie-consent-content {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .cookie-consent-text {
        margin: 0;
        font-size: 14px;
      }
      .cookie-consent-text a {
        color: #f59e0b;
      }
      .cookie-consent-actions {
        display: flex;
        gap: 8px;
      }
      .cookie-consent-btn {
        border: 1px solid transparent;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 12px;
        cursor: pointer;
      }
      .cookie-consent-btn-accept {
        background: #f59e0b;
        color: #0f172a;
      }
      .cookie-consent-btn-reject {
        background: transparent;
        color: #e2e8f0;
        border-color: rgba(148, 163, 184, 0.4);
      }
      @media (min-width: 900px) {
        .cookie-consent-banner {
          left: 24px;
          right: auto;
          max-width: 540px;
        }
      }
    </style>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());

      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
      });

      const consentChoice = localStorage.getItem('dp_cookie_consent');
      if (consentChoice === 'granted') {
        gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'granted',
        });
      }

      gtag('config', '${GA_MEASUREMENT_ID}');
    </script>
  </head>
  <body>
    <div id="app"></div>
    <div id="cookie-consent-banner" class="cookie-consent-banner" hidden>
      <div class="cookie-consent-content">
        <p class="cookie-consent-text">
          We use cookies for traffic analytics. Read our
          <a href="https://dungeonplanner.com/privacy-cookie-policy.html" target="_blank" rel="noreferrer">Privacy &amp; Cookie Policy</a>.
        </p>
        <div class="cookie-consent-actions">
          <button id="cookie-consent-reject" class="cookie-consent-btn cookie-consent-btn-reject" type="button">Reject</button>
          <button id="cookie-consent-accept" class="cookie-consent-btn cookie-consent-btn-accept" type="button">Accept</button>
        </div>
      </div>
    </div>
    <script>
      window.$docsify = {
        name: 'DungeonPlanner Docs',
        repo: 'https://github.com/finger-gun/DungeonPlanner',
        loadSidebar: '_sidebar.md',
        homepage: 'index.md',
        relativePath: true,
        auto2top: true,
        maxLevel: 3,
        subMaxLevel: 2,
        themeColor: '#f59e0b',
      };

      const consentBanner = document.getElementById('cookie-consent-banner');
      const acceptCookies = document.getElementById('cookie-consent-accept');
      const rejectCookies = document.getElementById('cookie-consent-reject');

      const applyConsent = (granted) => {
        localStorage.setItem('dp_cookie_consent', granted ? 'granted' : 'denied');
        gtag('consent', 'update', {
          ad_storage: granted ? 'granted' : 'denied',
          ad_user_data: granted ? 'granted' : 'denied',
          ad_personalization: granted ? 'granted' : 'denied',
          analytics_storage: granted ? 'granted' : 'denied',
        });
        consentBanner.hidden = true;
      };

      if (!localStorage.getItem('dp_cookie_consent')) {
        consentBanner.hidden = false;
      }

      acceptCookies.addEventListener('click', () => applyConsent(true));
      rejectCookies.addEventListener('click', () => applyConsent(false));
    </script>
    <script src="https://cdn.jsdelivr.net/npm/docsify@4/lib/docsify.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/docsify@4/lib/plugins/search.min.js"></script>
  </body>
</html>
`

function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join('/')
}

function toTitle(value) {
  return value
    .replace(/\.[^.]+$/, '')
    .split(/[-_/]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getDocOrder(filename) {
  const index = DOC_FILE_ORDER.indexOf(filename)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function sortDocsByOrderThenName(a, b) {
  const aName = path.basename(a)
  const bName = path.basename(b)
  const orderDiff = getDocOrder(aName) - getDocOrder(bName)
  if (orderDiff !== 0) return orderDiff
  return a.localeCompare(b)
}

async function collectDocsFiles(baseDir, relativeDir = '') {
  const absoluteDir = path.join(baseDir, relativeDir)
  const entries = await readdir(absoluteDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const nextRelative = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectDocsFiles(baseDir, nextRelative)))
      continue
    }

    if (
      entry.name.endsWith('.md') ||
      entry.name.endsWith('.png') ||
      entry.name.endsWith('.jpg') ||
      entry.name.endsWith('.jpeg') ||
      entry.name.endsWith('.svg')
    ) {
      files.push(nextRelative)
    }
  }

  return files
}

function buildSidebar(markdownFiles) {
  const lines = ['# DungeonPlanner Docs']
  const mdFiles = markdownFiles.map(toPosixPath)

  const rootDocs = mdFiles
    .filter((file) => !file.includes('/'))
    .sort(sortDocsByOrderThenName)
  const hasHome = rootDocs.includes('index.md')

  lines.push('')
  lines.push(hasHome ? '- [Home](index.md)' : '- [Docs Home](./)')

  for (const file of rootDocs) {
    if (file === 'index.md') continue
    const title = DOC_TITLES[file] ?? toTitle(file)
    lines.push(`- [${title}](${file})`)
  }

  const grouped = new Map()
  for (const file of mdFiles) {
    if (!file.includes('/')) continue
    const [groupName] = file.split('/')
    if (!grouped.has(groupName)) grouped.set(groupName, [])
    grouped.get(groupName).push(file)
  }

  const orderedGroups = [...grouped.keys()].sort((a, b) => a.localeCompare(b))
  for (const group of orderedGroups) {
    const groupFiles = grouped.get(group).sort((a, b) => a.localeCompare(b))
    lines.push('')
    lines.push(`- ${toTitle(group)}`)
    for (const file of groupFiles) {
      const title = toTitle(file.slice(group.length + 1))
      lines.push(`  - [${title}](${file})`)
    }
  }

  return `${lines.join('\n')}\n`
}

async function main() {
  await mkdir(docsWebDir, { recursive: true })
  await rm(docsOutDir, { recursive: true, force: true })
  await mkdir(docsOutDir, { recursive: true })

  const docsFiles = await collectDocsFiles(docsSourceDir)
  const markdownFiles = docsFiles.filter((file) => file.endsWith('.md'))

  for (const relativePath of docsFiles) {
    const sourcePath = path.join(docsSourceDir, relativePath)
    const targetPath = path.join(docsOutDir, relativePath)
    await mkdir(path.dirname(targetPath), { recursive: true })
    await copyFile(sourcePath, targetPath)
  }

  await writeFile(path.join(docsOutDir, 'index.html'), docsIndexHtml, 'utf8')
  await writeFile(path.join(docsOutDir, '_sidebar.md'), buildSidebar(markdownFiles), 'utf8')

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
