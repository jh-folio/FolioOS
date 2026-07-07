import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React island shell for gradual adoption.
//
// The existing vanilla `public/` app stays the shell; Vite builds fixed-name
// bundles into `public/react/` so `index.html` can reference them with plain
// <script>/<link> tags. Fixed filenames (no content hash) keep the static
// HTML reference stable across builds — the local FastAPI server serves them.
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "../public/react",
    emptyOutDir: true,
    // A single entry that mounts every React island into pre-existing DOM roots.
    lib: {
      entry: "src/main.tsx",
      formats: ["es"],
      fileName: () => "folio-react.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "folio-react.css",
      },
    },
  },
});
