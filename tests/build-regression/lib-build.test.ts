import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {z} from 'zod';
import {describe, expect, it} from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const PackageExportsSchema = z.object({
	main: z.string(),
	module: z.string(),
	types: z.string(),
	files: z.array(z.string()),
	exports: z.object({
		'.': z.object({
			types: z.string(),
			import: z.string(),
			default: z.string(),
		}),
		'./styles/gantt.css': z.string(),
	}),
});

function readJsonSafe(path: string): unknown {
	return JSON.parse(readFileSync(path, 'utf8'));
}

describe('library build output', () => {
	it('produces ESM bundle with expected exports', () => {
		const content = readFileSync(resolve(ROOT, 'dist/index.mjs'), 'utf8');
		expect(content).toContain('export {');
		expect(content).toContain('GanttChart');
		expect(content).toContain('parseGanttInput');
		expect(content).toContain('safeParseGanttInput');
	});

	it('produces type declarations', () => {
		const content = readFileSync(resolve(ROOT, 'dist/index.d.mts'), 'utf8');
		expect(content).toContain('declare class GanttChart');
		expect(content).toContain('GanttInstance');
		expect(content).toContain('GanttOptions');
		expect(content).toContain('export {');
	});

	it('copies CSS to dist/styles/gantt.css', () => {
		const content = readFileSync(resolve(ROOT, 'dist/styles/gantt.css'), 'utf8');
		expect(content).toContain('.gantt-root');
		expect(content).toContain('--gantt-bg');
		expect(content).toContain('--gantt-font');
	});

	it('externalizes runtime dependencies (zod) and does not bundle them inline', () => {
		const content = readFileSync(resolve(ROOT, 'dist/index.mjs'), 'utf8');
		expect(content).toContain('import { z } from "zod"');
	});

	it('package.json has correct publish fields', () => {
		const raw = readJsonSafe(resolve(ROOT, 'package.json'));
		const pkg = PackageExportsSchema.parse(raw);

		expect(pkg.main).toBe('./dist/index.mjs');
		expect(pkg.module).toBe('./dist/index.mjs');
		expect(pkg.types).toBe('./dist/index.d.mts');
		expect(pkg.files).toEqual(['dist']);

		const {exports} = pkg;
		const rootExport = exports['.'];
		expect(rootExport.types).toBe('./dist/index.d.mts');
		expect(rootExport.import).toBe('./dist/index.mjs');
		expect(rootExport.default).toBe('./dist/index.mjs');

		expect(exports['./styles/gantt.css']).toBe('./dist/styles/gantt.css');
	});
});
