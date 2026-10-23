import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Colori solo da token (app/globals.css): niente palette Tailwind fissa né classi dark:,
// che ignorano il tema chiaro/scuro.
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES =
  "bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|placeholder|decoration|accent|caret";
const HARDCODED_COLOR = `/(^|[^a-z-])(${UTILITIES})-(${PALETTE})-[0-9]{2,3}/`;
const DARK_VARIANT = "/(^|\\s)dark:/";

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
  ]),
  {
    // components/ui è base shadcn e resta fuori.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...["Literal[value=", "TemplateElement[value.raw="].flatMap((node) => [
          {
            selector: `${node}${HARDCODED_COLOR}]`,
            message: "Colore fisso della palette Tailwind: usa un token di app/globals.css (es. bg-surface-1, text-text-1).",
          },
          {
            selector: `${node}${DARK_VARIANT}]`,
            message: "Niente classi dark: — il tema chiaro/scuro passa dai token in app/globals.css.",
          },
        ]),
      ],
    },
  },
]);

export default eslintConfig;
