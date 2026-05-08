import {describe, expect, it} from 'vitest';
import {parseGanttInput, SpecialDaySchema, type GanttInputRaw} from './schemas.ts';

describe('schema utilities', () => {
	it('parses valid input and applies defaults', () => {
		const parsed = parseGanttInput({
			tasks: [
				{id: 1, text: 'Task', startDate: '2026-01-01', durationHours: 48, kind: 'task'},
				{id: 2, text: 'Task 2', startDate: '2026-01-03', durationHours: 24, kind: 'task'},
			],
			links: [{id: 1, source: 1, target: 2}],
		});
		expect(parsed.tasks[0]).toMatchObject({kind: 'task', percentComplete: 0});
		expect(parsed.links[0]?.type).toBe('FS');
	});

	it('returns empty links array when links omitted', () => {
		expect(parseGanttInput({tasks: [{id: 1, text: 'X', startDate: '2026-01-01', durationHours: 24, kind: 'task'}]}).links).toEqual([]);
	});

	it('rejects invalid task fields', () => {
		expect(() => parseGanttInput({tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', durationHours: -1, kind: 'task'}]})).toThrow();
		expect(() => parseGanttInput({tasks: [{id: 1, text: '', startDate: '2026-01-01', durationHours: 24, kind: 'task'}]})).toThrow();
		expect(() => parseGanttInput({tasks: [{id: 1.5, text: 'Task', startDate: '2026-01-01', durationHours: 24, kind: 'task'}]})).toThrow();
	});

	it('rejects invalid link fields', () => {
		expect(() =>
			parseGanttInput({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', durationHours: 24, kind: 'task'}],
				links: [{id: 1, source: -1, target: 1}],
			}),
		).toThrow();
		expect(() =>
			parseGanttInput({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', durationHours: 24, kind: 'task'}],
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
			tasks: [{id: 1, text: 'Minimal', startDate: '2026-04-01', durationHours: 120, kind: 'task'}],
		});
		expect(parsed.tasks[0]).toMatchObject({kind: 'task', percentComplete: 0});
		expect(parsed.tasks[0]?.parent).toBeUndefined();
		expect(parsed.tasks[0]?.color).toBeUndefined();
	});

	it('rejects duplicate task ids', () => {
		expect(() =>
			parseGanttInput({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
					{id: 1, text: 'B', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
				],
			}),
		).toThrow('Duplicate task id');
	});

	it('rejects duplicate link ids', () => {
		expect(() =>
			parseGanttInput({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
					{id: 2, text: 'B', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
				],
				links: [
					{id: 1, source: 1, target: 2},
					{id: 1, source: 2, target: 1},
				],
			}),
		).toThrow('Duplicate link id');
	});

	it('rejects duplicate link pairs', () => {
		expect(() =>
			parseGanttInput({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
					{id: 2, text: 'B', startDate: '2026-01-01', durationHours: 24, kind: 'task'},
				],
				links: [
					{id: 1, source: 1, target: 2},
					{id: 2, source: 1, target: 2},
				],
			}),
		).toThrow('Duplicate link pair');
	});

	it('rejects self-links', () => {
		expect(() =>
			parseGanttInput({
				tasks: [{id: 1, text: 'A', startDate: '2026-01-01', durationHours: 24, kind: 'task'}],
				links: [{id: 1, source: 1, target: 1}],
			}),
		).toThrow('cannot connect a task to itself');
	});

	it('accepts input annotated with GanttInputRaw type', () => {
		const raw: GanttInputRaw = {
			tasks: [{id: 1, text: 'Typed', startDate: '2026-05-01', durationHours: 72, kind: 'task'}],
		};
		const parsed = parseGanttInput(raw);
		expect(parsed.tasks[0]?.text).toBe('Typed');
		expect(parsed.links).toEqual([]);
	});
});
