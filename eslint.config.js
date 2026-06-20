import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.scripts.json"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
