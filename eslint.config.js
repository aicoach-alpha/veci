import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: ['dist/**', 'node_modules/**']
	},
	{
		files: ['veci/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.browser
		},
		rules: {
			...js.configs.recommended.rules,
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'no-empty': ['error', { allowEmptyCatch: true }]
		}
	},
	{
		files: ['scripts/**/*.js', 'eslint.config.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.node
		},
		rules: {
			...js.configs.recommended.rules,
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'no-empty': ['error', { allowEmptyCatch: true }]
		}
	}
];
