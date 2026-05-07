import {describe, expect, it} from 'vitest';
import {parseGanttInput, safeParseGanttInput, SpecialDaySchema, type GanttInputRaw} from './schemas.ts';

describe('schema utilities', () => {
	it('parses valid input and applies defaults', () => {
		const parsed = parseGanttInput({
			tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', duration: 2}],
			links: [{id: 1, source: 1, target: 1}],
		});
		expect(parsed.tasks[0]?.progress).toBe(0);
		expect(parsed.tasks[0]?.type).toBe('task');
		expect(parsed.tasks[0]?.open).toBe(true);
		expect(parsed.links[0]?.type).toBe('FS');
	});

	it('safeParse returns null for invalid payload', () => {
		expect(safeParseGanttInput({tasks: []})).toBeNull();
		expect(safeParseGanttInput({tasks: [{id: -1}]} as unknown as GanttInputRaw)).toBeNull();
	});

	it('rejects invalid task fields', () => {
		expect(() => parseGanttInput({tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', duration: -1}]})).toThrow();
		expect(() => parseGanttInput({tasks: [{id: 1, text: '', startDate: '2026-01-01', duration: 1}]})).toThrow();
		expect(() => parseGanttInput({tasks: [{id: 1.5, text: 'Task', startDate: '2026-01-01', duration: 1}]})).toThrow();
	});

	it('rejects invalid link fields', () => {
		expect(() =>
			parseGanttInput({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', duration: 1}],
				links: [{id: 1, source: -1, target: 1}],
			}),
		).toThrow();
		expect(() =>
			parseGanttInput({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', duration: 1}],
				links: [{id: 1, source: 1, target: 1, type: 'INVALID'}],
			} as unknown as GanttInputRaw),
		).toThrow();
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

	it('applies defaults on minimal input with only required fields', () => {
		const parsed = parseGanttInput({
			tasks: [{id: 1, text: 'Minimal', startDate: '2026-04-01', duration: 5}],
		});
		expect(parsed.tasks).toHaveLength(1);
		expect(parsed.links).toEqual([]);
		expect(parsed.tasks[0]?.progress).toBe(0);
		expect(parsed.tasks[0]?.type).toBe('task');
		expect(parsed.tasks[0]?.open).toBe(true);
		expect(parsed.tasks[0]?.parent).toBeUndefined();
		expect(parsed.tasks[0]?.color).toBeUndefined();
	});

	it('accepts input annotated with GanttInputRaw type', () => {
		const raw: GanttInputRaw = {
			tasks: [{id: 1, text: 'Typed', startDate: '2026-05-01', duration: 3}],
		};
		const parsed = parseGanttInput(raw);
		expect(parsed.tasks[0]?.text).toBe('Typed');
		expect(parsed.links).toEqual([]);
	});

	it('safeParse returns parsed data for valid input', () => {
		const result = safeParseGanttInput({
			tasks: [{id: 1, text: 'Safe', startDate: '2026-05-01', duration: 3}],
		});
		expect(result).not.toBeNull();
		expect(result?.tasks[0]?.text).toBe('Safe');
		expect(result?.links).toEqual([]);
	});

	it('safeParse returns null for various invalid shapes', () => {
		expect(safeParseGanttInput({tasks: []})).toBeNull();
		expect(safeParseGanttInput({tasks: [{id: 0, text: 'X', startDate: '2026-01-01', duration: 1}]})).toBeNull();
		expect(safeParseGanttInput({tasks: [{id: 1, text: 'X', startDate: 'not-a-date', duration: 1}]})).toBeNull();
	});
});
