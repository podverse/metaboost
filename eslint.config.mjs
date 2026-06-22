import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import perfectionist from 'eslint-plugin-perfectionist';
// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

import requireRelativeJsExtension from './eslint-rules/require-relative-js-extension.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      perfectionist,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      semi: ['error', 'always'],
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          groups: [
            'type',
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'style',
            'unknown',
          ],
          internalPattern: ['^@metaboost/'],
          newlinesBetween: 'always',
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs', 'scripts/**/*.cjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['tools/**/*.js', 'tools/**/*.mjs', 'tools/**/*.cjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts', '**/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-empty-pattern': 'off',
    },
  },
  {
    files: [
      'packages/**/*.{ts,tsx}',
      'apps/api/**/*.{ts,tsx}',
      'apps/management-api/**/*.{ts,tsx}',
      'apps/web/sidecar/**/*.{ts,tsx}',
      'apps/management-web/sidecar/**/*.{ts,tsx}',
      'tools/**/*.{ts,tsx}',
      'scripts/**/*.{ts,mts}',
    ],
    plugins: {
      nodeNextRelativeImports: {
        rules: {
          'require-relative-js-extension': requireRelativeJsExtension,
        },
      },
    },
    rules: {
      'nodeNextRelativeImports/require-relative-js-extension': 'error',
    },
  },
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'nodeNextRelativeImports/require-relative-js-extension': 'off',
    },
  },
  {
    files: [
      'apps/web/src/**/*.{ts,tsx}',
      'apps/management-web/src/**/*.{ts,tsx}',
      'apps/web/e2e/**/*.{ts,tsx}',
      'apps/management-web/e2e/**/*.{ts,tsx}',
    ],
    plugins: {
      nodeNextRelativeImports: {
        rules: {
          'require-relative-js-extension': requireRelativeJsExtension,
        },
      },
    },
    rules: {
      'nodeNextRelativeImports/require-relative-js-extension': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/*.js',
      '**/*.d.ts',
      '**/.llm/**',
      '**/*.md',
      '**/*.mdc',
    ],
  },
  eslintConfigPrettier,
  storybook.configs['flat/recommended']
);
