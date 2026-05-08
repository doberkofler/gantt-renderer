import {describe, expect, it} from 'vitest';
import {parseGanttInput} from '../lib/index.ts';
import {RAW_INPUT} from './data.ts';

describe('demo data scenario', () => {
	it('models a realistic software implementation project', () => {
		const parsed = parseGanttInput(RAW_INPUT);
		expect(parsed.tasks.length).toBeGreaterThanOrEqual(20);
		expect(parsed.links.length).toBeGreaterThanOrEqual(20);

		const taskTypes = new Set(parsed.tasks.map((task) => task.type));
		expect(taskTypes.has('project')).toBe(true);
		expect(taskTypes.has('task')).toBe(true);
		expect(taskTypes.has('milestone')).toBe(true);

		expect(parsed.tasks.some((task) => task.text === 'Discovery and Planning')).toBe(true);
		expect(parsed.tasks.some((task) => task.text === 'Build and Configuration')).toBe(true);
		expect(parsed.tasks.some((task) => task.text === 'Validation and Release')).toBe(true);

		expect(parsed.tasks.some((task) => task.parent === 1340)).toBe(true);
		expect(parsed.links.some((link) => link.type === 'SS')).toBe(true);
		expect(parsed.links.some((link) => link.type === 'FF')).toBe(true);
	});
});
