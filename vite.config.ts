import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { randomBytes } from 'node:crypto'

function securityHeaders() {
  const nonceMap = new Map<string, string>()
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const nonce = randomBytes(16).toString('base64')
        res.setHeader(
          'Content-Security-Policy',
          `default-src 'self'; script-src 'self' 'nonce-${nonce}'; object-src 'none'; base-uri 'self'`
        )
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=63072000; includeSubDomains; preload'
        )
        res.setHeader('X-Content-Type-Options', 'nosniff')
        nonceMap.set(req.originalUrl, nonce)
        res.on('finish', () => nonceMap.delete(req.originalUrl))
        next()
      })
    },
    transformIndexHtml(html: string, ctx) {
      const nonce = nonceMap.get(ctx.originalUrl || ctx.path)
      return nonce ? html.replace(/<script/gi, `<script nonce="${nonce}"`) : html
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), securityHeaders()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
