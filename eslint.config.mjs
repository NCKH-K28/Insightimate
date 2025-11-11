import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import eslintNextPlugin from '@next/eslint-plugin-next';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { next: eslintNextPlugin, 'react-hooks': eslintPluginReactHooks },
  },
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'tailwindcss/no-custom-classname': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // FIXME: enable later
      '@next/next/no-img-element': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.temp',
    'src/components/tiptap-**/*',
    'src/components/ui/**',
  ]),
]);
