import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    include: [
      'three/examples/jsm/nodes/display/BloomNode.js',
      'three/examples/jsm/renderers/webgpu/WebGPURenderer.js'
    ]
  },
  server: {
    port: 3000,
    open: true
  }
}) 