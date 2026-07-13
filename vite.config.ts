import { defineConfig } from "vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const webMode = process.env.HAL_WEB === "true";

// https://vite.dev/config/
export default defineConfig(async () => ({
  clearScreen: false,
  server: {
    port: webMode ? 5173 : 1420,
    strictPort: !webMode,
    host: webMode ? "0.0.0.0" : host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
