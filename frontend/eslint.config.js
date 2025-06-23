import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';

// export default defineConfig([
//     { files: ['**/*.{js,mjs,cjs,vue}'], plugins: { js }, extends: ['js/recommended'] },
//     { files: ['**/*.{js,mjs,cjs,vue}'], languageOptions: { globals: globals.browser } },
//     pluginVue.configs['flat/essential'],
// ]);
import prettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig([
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js'],
    },
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.js', '**/*.vue'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
        },
        plugins: {
            'unused-imports': unusedImports,
        },

        rules: {
            'vue/multi-word-component-names': 'off',
            ...js.configs.recommended.rules,
            ...prettier.rules,

            'no-console': 'off',
            'no-debugger': 'warn',

            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
        },
    },
    // { files: ['**/*.{js,mjs,cjs,vue}'], languageOptions: { globals: globals.browser } },
]);
