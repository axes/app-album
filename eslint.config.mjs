import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "drizzle/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // DESIGN v2 §6: every icon comes from the single semantic module.
    // Importing `lucide-react` anywhere else would bypass the map and let a
    // glyph drift from its meaning. `src/components/ui/icons.tsx` is the only
    // allowed importer; the guard test enforces the same rule at runtime.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/icons.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message:
                "Import icons from '@/components/ui/icons' instead of 'lucide-react' (DESIGN v2 §6).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
