import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // I moduli di contesto espongono di proposito il Provider E i suoi hook dallo
    // stesso file (AuthContext, DayContext, ToastContext, PrefsContext): e' il
    // pattern scelto dal progetto, cosi' chi consuma un contesto ha un solo import.
    // `only-export-components` serve all'hot-reload di Vite, non alla correttezza:
    // il prezzo e' un full reload quando si tocca un file di contesto in sviluppo.
    files: ['src/context/**/*.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
