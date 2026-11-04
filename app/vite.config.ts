import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // caminhos relativos: o dist/ abre de qualquer pasta ou subcaminho
  base: './',
  // KaTeX + React Flow + conteúdo ficam ~1 MB (300 kB gzip): aceitável para um app de estudo
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [react(), tailwindcss()],
})
