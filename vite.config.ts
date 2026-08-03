import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore Vite's runtime provides Node built-ins; the app intentionally keeps the client dependency-free.
import fs from 'node:fs'
// @ts-ignore Vite's runtime provides Node built-ins; the app intentionally keeps the client dependency-free.
import path from 'node:path'

function bundledGamesStatic() {
  return {
    name: 'bundled-games-static',
    closeBundle() {
      for (const game of ['flight-battle', 'zombie-game']) {
        const source = path.resolve('outputs', game)
        const destination = path.resolve('dist', game)
        if (!fs.existsSync(source)) continue
        fs.rmSync(destination, { recursive: true, force: true })
        fs.cpSync(source, destination, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), bundledGamesStatic()],
})
