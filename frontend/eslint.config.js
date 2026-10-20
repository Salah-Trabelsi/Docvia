import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["src/components/ui/button.tsx", "src/components/ui/badge.tsx"],
    rules: {
      // Preserve shadcn's public CVA helpers alongside their components.
      "react-refresh/only-export-components": [
        "error",
        {
          ...reactRefresh.configs.vite.rules[
            "react-refresh/only-export-components"
          ][1],
          allowExportNames: ["buttonVariants", "badgeVariants"],
        },
      ],
    },
  },
]);
