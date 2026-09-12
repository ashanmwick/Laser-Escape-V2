import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

// Dev server + build. Fast HMR matters when tuning feel (Tech.md §1).
//
// Two entries: the game (index.html) and the podium_stage prop inspector
// (podium-stage.html, src/podiumStagePreview.js). Naming both keeps the
// inspector's dev-only imports — three's OrbitControls and GLTFExporter — out
// of the game's bundle instead of relying on tree-shaking. This config is an
// ES module (package.json "type": "module"), so paths come from import.meta,
// not __dirname.
const at = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: at('./index.html'),
        podiumStage: at('./podium-stage.html'),
      },
    },
  },
})
