import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/examples/jsm': path.resolve('./node_modules/three/examples/jsm')
    }
  },
  esbuild: {
    target: 'es2022'
  },
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