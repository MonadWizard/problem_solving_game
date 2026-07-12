// Optional Cloudflare Worker: proxies LeetCode's public GraphQL API to check
// whether a username's recent accepted submissions include a given problem.
// Not auto-deployed — see README.md. The frontend only calls this when
// VITE_VERIFY_WORKER_URL is set; "Mark solved" is honor-system otherwise.
//
// Request:  GET /?username=<leetcode_username>&slug=<problem_slug>
// Response: { "checked": true, "solved": boolean }

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'
const RECENT_LIMIT = 20
const CACHE_TTL_MS = 60_000

// Best-effort per-isolate cache. Not durable across deploys/isolates, but
// cuts repeat-click load on LeetCode's API within a session.
const cache = new Map() // username -> { at: number, slugs: Set<string> }

const QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      titleSlug
    }
  }
`

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function fetchRecentSlugs(username) {
  const cached = cache.get(username)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.slugs

  const res = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { username, limit: RECENT_LIMIT } }),
  })
  if (!res.ok) throw new Error(`LeetCode API responded ${res.status}`)
  const json = await res.json()
  const slugs = new Set(
    (json?.data?.recentAcSubmissionList ?? []).map((s) => s.titleSlug),
  )
  cache.set(username, { at: Date.now(), slugs })
  return slugs
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    const slug = url.searchParams.get('slug')
    if (!username || !slug) {
      return new Response(JSON.stringify({ error: 'username and slug query params are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    }

    try {
      const slugs = await fetchRecentSlugs(username)
      return new Response(JSON.stringify({ checked: true, solved: slugs.has(slug) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    } catch {
      // Upstream hiccup: tell the caller verification didn't run so it can
      // fall back to honor-system rather than blocking the user.
      return new Response(JSON.stringify({ checked: false, solved: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      })
    }
  },
}
