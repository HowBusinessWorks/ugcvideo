import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
    allowedHosts: ['*', 'ca8614b9eb7f.ngrok-free.app', '.ngrok-free.app'],
  },
})
