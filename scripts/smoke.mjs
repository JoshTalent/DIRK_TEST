import { createServer } from 'node:http'
import { createReadStream, readFileSync, readdirSync, statSync } from 'node:fs'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }

const hardTimeout = setTimeout(() => {
  console.error('FAIL: smoke test exceeded 60s')
  process.exit(1)
}, 60_000)

// Serve dist/ so jsdom can actually fetch the stylesheet and fire its load event.
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  try {
    if (!statSync(file).isFile()) throw new Error('not a file')
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404).end('not found')
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}/`

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const js = readdirSync(join(DIST, 'assets')).find((f) => f.endsWith('.js'))
if (!js) throw new Error('No built JS bundle found in dist/assets')

const dom = new JSDOM(html, { url: base, resources: 'usable', pretendToBeVisual: true })
const { window } = dom

// The bundle is an ES module expecting browser globals; point Node's globals
// at the jsdom window so document/window resolve during import.
const GLOBALS = [
  'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
  'matchMedia', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback', 'HTMLElement', 'Element', 'Node', 'Event',
  'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'UIEvent', 'DOMParser', 'MutationObserver',
  'IntersectionObserver', 'ResizeObserver', 'CSS', 'Image', 'SVGElement', 'FocusEvent',
  'InputEvent', 'ErrorEvent', 'PerformanceObserver', 'structuredClone', 'queueMicrotask',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
]
for (const key of GLOBALS) {
  if (key in window && !(key in globalThis)) {
    Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true })
  }
}
globalThis.window = window
globalThis.self = window
window.scrollTo = () => {}
window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
window.IntersectionObserver ??= class {
  observe() {} unobserve() {} disconnect() {} takeRecords() { return [] }
}

const errors = []
const origError = console.error
console.error = (...args) => {
  errors.push(args.map((a) => (a instanceof Error ? (a.stack ?? a.message) : String(a))).join(' '))
  origError(...args)
}
window.addEventListener('error', (e) => errors.push(String(e.error ?? e.message)))

// Copy the bundle to a .mjs so Node treats it as a real ES module.
const modPath = join(mkdtempSync(join(tmpdir(), 'test-smoke-')), 'bundle.mjs')
writeFileSync(modPath, readFileSync(join(DIST, 'assets', js), 'utf8'))

await import(pathToFileURL(modPath).href)
await new Promise((r) => setTimeout(r, 3000))

const root = window.document.getElementById('app')
const text = (root?.textContent ?? '').replace(/\s+/g, ' ').trim()

const BENIGN =
  /ResizeObserver|Not implemented|defaultProps|An empty tree|non-boolean attribute|Received `true`|is deprecated|not wrapped in act|passive event listener/i
const fatal = errors.filter((e) => !BENIGN.test(e))

const checks = [
  ['mount point rendered', Boolean(root?.childNodes.length)],
  ['page has text', text.length > 200],
  ['branded as TEST', text.includes('TEST')],
  ['credits DIRKUBALD', text.includes('DIRKUBALD')],
  ['RWF currency shown', /RWF\s?[\d,]+/.test(text)],
  ['no fatal errors', fatal.length === 0],
]

console.log('sample text :', text.slice(0, 220))
console.log('errors      :', errors.length, '(fatal:', fatal.length + ')')
for (const e of fatal.slice(0, 5)) console.log('  -', e.slice(0, 300))
console.log('')
let failed = false
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed = true
}

clearTimeout(hardTimeout)
server.close()
window.close()
console.log(failed ? '\nFAIL' : '\nPASS: app mounted, branded, credited and priced in RWF')
process.exit(failed ? 1 : 0)
