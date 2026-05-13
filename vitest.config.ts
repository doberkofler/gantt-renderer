import path from 'node:path';
import {cwd} from 'node:process';

import {playwright} from '@vitest/browser-playwright';
import {defineConfig} from 'vitest/config';

const rootDir = cwd();

export default defineConfig({
	test: {
		browser: {
			provider: playwright(),
			enabled: true,
			headless: true,
			instances: [{browser: 'chromium'}, {browser: 'firefox'}, {browser: 'webkit'}],
			screenshotDirectory: path.join(rootDir, '__screenshots__'),
		},
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		coverage: {
			enabled: true,
			reporter: ['text', 'html', 'lcov'],
			exclude: ['scripts/**', 'coverage/**', 'dist/**'],
			provider: 'istanbul',
			thresholds: {
				statements: 95,
				branches: 85,
				functions: 95,
				lines: 95,
			},
		},
	},
});
