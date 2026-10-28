import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Generated bundles/private snapshots/vendor and legacy one-off repair scripts are not application source.
  globalIgnores(['dist/**', 'dist-ssr/**', 'assets/**', '.phase2-build-check/**', 'backend/storage/**', 'backend/vendor/**', 'fix_*.js', 'fix_*.cjs']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['copy-backend.js', 'vite.config.js', 'tools/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
