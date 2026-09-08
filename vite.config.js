import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server + build. Fast HMR matters when tuning feel (Tech.md §1).
export default defineConfig({
  plugins: [react()],
})
