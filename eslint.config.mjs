import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated files:
    "src/generated/**",
  ]),
  {
    rules: {
      // Downgrade to warning — progressive migration to strict types
      "@typescript-eslint/no-explicit-any": "warn",
      // Required for Prisma adapter pattern (dynamic require)
      "@typescript-eslint/no-require-imports": "warn",
      // False positive for async data-loading in effects — standard Next.js pattern
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
