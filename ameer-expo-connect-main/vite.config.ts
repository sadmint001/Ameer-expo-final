import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load .env vars into process.env so server-side code (supabase-server.ts,
  // pesapal.ts, notify.ts, etc.) can read them at runtime. Vite only exposes
  // .env values via import.meta.env on the client; server functions need
  // process.env which isn't populated from .env by default.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, val] of Object.entries(env)) {
    process.env[key] ??= val;
  }

  return {
    plugins: [
      tanstackStart({
        server: { entry: "server" },
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
  };
});
