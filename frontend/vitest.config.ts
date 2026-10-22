import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": import.meta.dirname + "/src" },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    clearMocks: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
