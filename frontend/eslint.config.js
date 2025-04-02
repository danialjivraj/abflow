import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import spellcheck from "eslint-plugin-spellcheck";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: true,
        __dirname: true,
        __filename: true,
        jest: true,
        describe: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
        it: true,
        require: true,
        module: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports,
      spellcheck,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/prop-types": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "spellcheck/spell-checker": [
        "warn",
        {
          comments: true,
          strings: false,
          identifiers: false,
          templates: false,
          lang: "en_US",
          skipWords: ["dict","eslint",
            "precommit",
            "aaa",
            "4caf50",
            "jsx",
            "undef",
            "user’s",
            "axios",
            "grey",
            "datasets",
            "Dropdown",
            "Assignee",
            "Blockquote",
            "notif1",
            "notif3",
            "resize",
          ],
          minLength: 3,
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx}", "**/*test.{js,jsx}"],
    rules: {
      "no-undef": "off",
      "no-empty-pattern": "off",
      "react/display-name": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },
];
