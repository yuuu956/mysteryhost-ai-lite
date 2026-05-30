import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mysteryhost-ai-lite/',
  plugins: [react()],
})