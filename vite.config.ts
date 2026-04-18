import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api/ark': {
          target: 'https://ark.cn-beijing.volces.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ark/, '/api/v3'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.ARK_API_KEY || env.VITE_ARK_API_KEY
              if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
            })
          },
        },
      },
    },
  }
})
