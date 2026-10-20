import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "public/**",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-debugger": "error",
      "no-async-promise-executor": "error",
      "no-promise-executor-return": "error",
      "no-unsafe-finally": "error",
    },
  },
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      // Use the TypeScript-aware rule for imports, types and runtime variables.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
