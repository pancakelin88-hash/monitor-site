import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore Vite's runtime provides Node built-ins; the app intentionally keeps the client dependency-free.
import fs from 'node:fs'
// @ts-ignore Vite's runtime provides Node built-ins; the app intentionally keeps the client dependency-free.
import path from 'node:path'

function flightBattleStatic() {
  return {
    name: 'flight-battle-static',
    closeBundle() {
      const source = path.resolve('outputs/flight-battle')
      const destination = path.resolve('dist/flight-battle')
      fs.rmSync(destination, { recursive: true, force: true })
      fs.cpSync(source, destination, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), flightBattleStatic()],
})
