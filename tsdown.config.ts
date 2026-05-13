import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {defineConfig} from 'tsdown';

const LOCALES_DIR = join(import.meta.dirname, 'src/lib/locales');
const localeFiles = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.ts') && f !== 'loadLocale.ts' && f !== 'registry.ts' && f !== 'all.ts');

const localeEntries: Record<string, string> = {};
for (const file of localeFiles) {
	const name = file.replace(/\.ts$/u, '');
	localeEntries[`locales/${name}`] = `src/lib/locales/${file}`;
}
localeEntries['locales/load'] = 'src/lib/locales/loadLocale.ts';
localeEntries['locales/registry'] = 'src/lib/locales/registry.ts';
localeEntries['locales/all'] = 'src/lib/locales/all.ts';

export default defineConfig({
	entry: {
		index: 'src/lib/index.ts',
		...localeEntries,
	},
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
