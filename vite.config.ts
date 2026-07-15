/// <reference types="vitest/config" />
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub project pages serve from /<repo>/. A public/CNAME file (custom
// domain) means Pages serves from the domain root instead, so it's detected
// here and defaults base to '/' automatically — this must never depend on
// someone remembering to also flip a separate VITE_BASE variable, since
// that's exactly how a CNAME add once shipped a blank site (assets 404ing
// under /grand-algorithm/ while served from the custom domain's root).
// VITE_BASE still wins when explicitly set, e.g. a user/org page
// (<user>.github.io) with no CNAME but which also serves from root.
// `||` (not `??`): CI passes unset repo variables through as '', which must
// still fall back to the default rather than becoming an empty base path.
const hasCustomDomain = existsSync(fileURLToPath(new URL('./public/CNAME', import.meta.url)))

export default defineConfig({
  base: process.env.VITE_BASE || (hasCustomDomain ? '/' : '/grand-algorithm/'),
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
  },
})
