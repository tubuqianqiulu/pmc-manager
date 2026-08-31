import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 运行模式：VITE_MODE=local（纯本地 localStorage，默认）| server（连接 FastAPI 后端）
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 本地开发时若需联调后端，把 VITE_MODE 设为 server 即可
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus', '@element-plus/icons-vue'],
          echarts: ['echarts']
        }
      }
    }
  }
})
