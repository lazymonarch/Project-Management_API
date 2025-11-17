import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.config({
    extends: ["next", "next/core-web-vitals"],
  }),
  {
    name: "taskflow-ignores",
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
