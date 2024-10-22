import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@codec-components": path.resolve(__dirname, "./src/lib/codecComponents"),
    },
  },
  plugins: [react()],
})
