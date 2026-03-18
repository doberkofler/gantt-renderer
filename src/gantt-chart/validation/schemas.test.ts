import {describe, expect, it} from 'vitest';
import {parseGanttInput, safeParseGanttInput, SpecialDaySchema} from './schemas.ts';

describe('schema utilities', () => {
	it('parses valid input and applies defaults', () => {
		const parsed = parseGanttInput({
			tasks: [{id: 1, text: 'Task', start_date: '2026-01-01', duration: 2}],
			links: [{id: 1, source: 1, target: 1}],
		});
		expect(parsed.tasks[0]?.progress).toBe(0);
		expect(parsed.tasks[0]?.type).toBe('task');
		expect(parsed.tasks[0]?.open).toBe(true);
		expect(parsed.links[0]?.type).toBe('FS');
	});

	it('safeParse returns null for invalid payload', () => {
		expect(safeParseGanttInput({tasks: []})).toBeNull();
		expect(safeParseGanttInput({tasks: [{id: -1}]})).toBeNull();
	});

	it('validates special day inputs', () => {
		expect(SpecialDaySchema.parse({date: '2026-12-25', kind: 'holiday', label: 'Christmas Day'})).toMatchObject({
			date: '2026-12-25',
			kind: 'holiday',
			label: 'Christmas Day',
		});
		expect(() => SpecialDaySchema.parse({date: '12/25/2026', kind: 'holiday'})).toThrow();
		expect(() => SpecialDaySchema.parse({date: '2026-12-25', kind: 'weekend'})).toThrow();
	});
});
