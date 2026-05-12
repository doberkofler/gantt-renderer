import {describe, expect, it} from 'vitest';
import {GanttInputSchema, SpecialDaySchema, type GanttInputRaw} from './schemas.ts';

describe('schema utilities', () => {
	it('parses valid input and applies defaults', () => {
		const parsed = GanttInputSchema.parse({
			tasks: [
				{id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task'},
				{id: 2, text: 'Task 2', startDate: '2026-01-03', endDate: '2026-01-04', kind: 'task'},
			],
			links: [{id: 1, source: 1, target: 2}],
		});
		expect(parsed.tasks[0]).toMatchObject({kind: 'task', percentComplete: 0});
		expect(parsed.links[0]?.type).toBe('FS');
	});

	it('returns empty links array when links omitted', () => {
		expect(GanttInputSchema.parse({tasks: [{id: 1, text: 'X', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}]}).links).toStrictEqual([]);
	});

	it('rejects invalid task fields', () => {
		expect(() => GanttInputSchema.parse({tasks: [{id: 1, text: 'Task', startDate: '2026-01-05', endDate: '2026-01-01', kind: 'task'}]})).toThrow();
		expect(() => GanttInputSchema.parse({tasks: [{id: 1, text: '', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}]})).toThrow();
		expect(() => GanttInputSchema.parse({tasks: [{id: 1.5, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}]})).toThrow();
	});

	it('rejects invalid link fields', () => {
		expect(() =>
			GanttInputSchema.parse({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}],
				links: [{id: 1, source: -1, target: 1}],
			}),
		).toThrow();
		expect(() =>
			GanttInputSchema.parse({
				tasks: [{id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}],
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
		const parsed = GanttInputSchema.parse({
			tasks: [{id: 1, text: 'Minimal', startDate: '2026-04-01', endDate: '2026-04-06', kind: 'task'}],
		});
		expect(parsed.tasks[0]).toMatchObject({kind: 'task', percentComplete: 0});
		expect(parsed.tasks[0]?.parent).toBeUndefined();
		expect(parsed.tasks[0]?.color).toBeUndefined();
	});

	it('rejects duplicate task ids', () => {
		expect(() =>
			GanttInputSchema.parse({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
					{id: 1, text: 'B', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
				],
			}),
		).toThrow('Duplicate task id');
	});

	it('rejects duplicate link ids', () => {
		expect(() =>
			GanttInputSchema.parse({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
					{id: 2, text: 'B', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
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
			GanttInputSchema.parse({
				tasks: [
					{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
					{id: 2, text: 'B', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'},
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
			GanttInputSchema.parse({
				tasks: [{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}],
				links: [{id: 1, source: 1, target: 1}],
			}),
		).toThrow('cannot connect a task to itself');
	});

	it('accepts input annotated with GanttInputRaw type', () => {
		const raw: GanttInputRaw = {
			tasks: [{id: 1, text: 'Typed', startDate: '2026-05-01', endDate: '2026-05-04', kind: 'task'}],
		};
		const parsed = GanttInputSchema.parse(raw);
		expect(parsed.tasks[0]?.text).toBe('Typed');
		expect(parsed.links).toStrictEqual([]);
	});

	it('accepts readonly on tasks', () => {
		const parsed = GanttInputSchema.parse({
			tasks: [
				{id: 1, text: 'Readonly', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task', readonly: true},
				{id: 2, text: 'Writable', startDate: '2026-01-03', endDate: '2026-01-04', kind: 'task', readonly: false},
				{id: 3, text: 'No Flag', startDate: '2026-01-05', endDate: '2026-01-06', kind: 'task'},
			],
		});
		expect(parsed.tasks[0]?.readonly).toBe(true);
		expect(parsed.tasks[1]?.readonly).toBe(false);
		expect(parsed.tasks[2]?.readonly).toBeUndefined();
	});

	it('accepts readonly on links', () => {
		const parsed = GanttInputSchema.parse({
			tasks: [
				{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task'},
				{id: 2, text: 'B', startDate: '2026-01-03', endDate: '2026-01-04', kind: 'task'},
				{id: 3, text: 'C', startDate: '2026-01-05', endDate: '2026-01-06', kind: 'task'},
			],
			links: [
				{id: 1, source: 1, target: 2, readonly: true},
				{id: 2, source: 2, target: 3, readonly: false},
				{id: 3, source: 3, target: 1},
			],
		});
		expect(parsed.links[0]?.readonly).toBe(true);
		expect(parsed.links[1]?.readonly).toBe(false);
		expect(parsed.links[2]?.readonly).toBeUndefined();
	});

	it('accepts readonly on milestones and projects', () => {
		const parsed = GanttInputSchema.parse({
			tasks: [
				{id: 1, text: 'Project', startDate: '2026-01-01', endDate: '2026-01-05', kind: 'project', readonly: true, open: true},
				{id: 2, text: 'Milestone', startDate: '2026-01-05', kind: 'milestone', readonly: true},
			],
		});
		expect(parsed.tasks[0]?.readonly).toBe(true);
		expect(parsed.tasks[1]?.readonly).toBe(true);
	});
});
