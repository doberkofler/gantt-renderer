import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/build-regression/**/*.test.ts'],
	},
});
