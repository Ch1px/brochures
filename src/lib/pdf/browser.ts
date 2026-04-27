import 'server-only'
import type { Browser } from 'puppeteer-core'

/**
 * Launches a headless Chromium tuned for the runtime:
 *  - Vercel/Linux production: @sparticuz/chromium-min + a hosted chromium pack
 *    (set CHROMIUM_PACK_URL to the .tar URL from the @sparticuz/chromium GitHub
 *    release matching the installed version).
 *  - Local dev: the user's installed Chrome/Edge. Set PUPPETEER_EXECUTABLE_PATH
 *    to override; otherwise the common Windows/macOS install paths are tried.
 *
 * The caller must `browser.close()` in a finally block so the underlying
 * process is reaped on every code path.
 */
export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default

  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.PDF_RUNTIME === 'serverless'

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    const packUrl = process.env.CHROMIUM_PACK_URL
    if (!packUrl) {
      throw new Error(
        'CHROMIUM_PACK_URL is not set. Provide a URL pointing to a @sparticuz/chromium release pack (.tar) so the serverless runtime can fetch the binary.'
      )
    }
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
    })
  }

  const executablePath = resolveLocalChrome()
  return puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

function resolveLocalChrome(): string {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH
  if (fromEnv) return fromEnv

  const candidates: string[] =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
          ]

  // Synchronous existence check — these are short, well-known paths.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs')
  for (const path of candidates) {
    try {
      if (fs.existsSync(path)) return path
    } catch {
      // ignore
    }
  }
  throw new Error(
    'No local Chrome/Edge found. Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH to a Chromium-based browser executable.'
  )
}
