import { env } from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: env.GITHUB_ACTIONS ? '/online-tourism-malawi/' : '/',
  define: {
    'import.meta.env.VITE_VERCEL_OBSERVABILITY': JSON.stringify(env.VERCEL === '1' || env.OTM_ENABLE_OBSERVABILITY === '1'),
  },
})
