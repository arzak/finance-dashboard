import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          const normalizedId = id.replaceAll('\\', '/')
          const nodeModulesPath = normalizedId.split('/node_modules/')[1]
          if (!nodeModulesPath) {
            return 'vendor'
          }

          const packageName = nodeModulesPath.startsWith('@')
            ? nodeModulesPath.split('/').slice(0, 2).join('/')
            : nodeModulesPath.split('/')[0]

          if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
            return 'react-vendor'
          }

          if (packageName === 'firebase' || packageName.startsWith('@firebase/')) {
            return 'firebase-vendor'
          }

          if (packageName === 'jspdf' || packageName === 'jspdf-autotable' || packageName === 'html2canvas' || packageName === 'dompurify') {
            return 'pdf-vendor'
          }

          if (packageName === 'recharts' || packageName.startsWith('d3-') || packageName === 'internmap') {
            return 'charts-vendor'
          }

          if (packageName === 'framer-motion' || packageName === 'motion-dom' || packageName === 'motion-utils') {
            return 'motion-vendor'
          }

          if (packageName === 'lucide-react') {
            return 'icons-vendor'
          }

          return undefined
        },
      },
    },
  },
})
