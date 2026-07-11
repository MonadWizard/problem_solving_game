import { readFileSync } from 'node:fs'
import { vi } from 'vitest'

/** Serve /data/*.json from public/ so the curriculum loader works in tests. */
export function mockDataFetch(): void {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input)
    const match = url.match(/\/data\/([a-z0-9]+)\.json$/)
    if (!match) throw new Error(`unexpected fetch in test: ${url}`)
    const body = readFileSync(`public/data/${match[1]}.json`, 'utf8')
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
}
