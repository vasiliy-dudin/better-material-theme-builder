import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
				customElements: 'readonly',
				HTMLElement: 'readonly',
				Event: 'readonly',
				CustomEvent: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				navigator: 'readonly',
				localStorage: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				Blob: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': ['warn', { 
				argsIgnorePattern: '^_', 
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_'
			}],
			'no-console': 'off',
		},
	},
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
];
