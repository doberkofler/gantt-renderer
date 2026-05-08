import {defineConfig} from 'tsdown';

export default defineConfig({
	entry: ['src/lib/index.ts'],
	format: ['esm'],
	dts: true,
	fixedExtension: true,
	outDir: 'dist',
	clean: true,
	target: 'es2022',
	platform: 'neutral',
	sourcemap: true,
	copy: [{from: 'src/styles/gantt.css', to: 'dist/styles', flatten: true}],
});
