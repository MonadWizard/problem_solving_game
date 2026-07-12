/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub project pages serve from /<repo>/. Override with VITE_BASE=/ for
// custom domains or user pages (see .claude/skills/deploy/SKILL.md).
// `||` (not `??`): CI passes unset repo variables through as '', which must
// still fall back to the default rather than becoming an empty base path.
export default defineConfig({
  base: process.env.VITE_BASE || '/grand-algorithm/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
  },
})
