import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  // 使产物可部署在任意子目录；直接双击仍不适合运行 Worker/WASM。
  base: './',
  plugins: [
    react(),
    {
      name: 'rename-production-entry',
      closeBundle() {
        const source = resolve('dist/index.html')
        const target = resolve('dist/ffmpeg.web.html')
        if (existsSync(source)) renameSync(source, target)
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(302, { Location: '/ffmpeg.web.html' })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
