import {describe, expect, it} from 'vitest';
import {BAR_HEIGHT, DENSITY, MILESTONE_HALF, MILESTONE_SIZE, ROW_HEIGHT, computeLayout, deriveViewport, totalContentHeight} from './layoutEngine.ts';
import {createPixelMapper} from './pixelMapper.ts';
import {type TaskNode} from '../domain/tree.ts';

const baseRows: TaskNode[] = [
	{
		id: 1,
		text: 'Task 1',
		startDate: '2026-01-01',
		endDate: '2026-01-03',
		percentComplete: 50,
		kind: 'task',
		depth: 0,
		children: [],
	},
	{
		id: 2,
		text: 'Milestone',
		startDate: '2026-01-03',
		kind: 'milestone',
		depth: 0,
		children: [],
	},
];

describe('layoutEngine utilities', () => {
	it('keeps derived density constants aligned', () => {
		expect(ROW_HEIGHT).toBe(DENSITY.rowHeight);
		expect(BAR_HEIGHT).toBe(DENSITY.barHeight);
		expect(MILESTONE_SIZE).toBe(DENSITY.milestoneSize);
		expect(MILESTONE_HALF * 2).toBe(MILESTONE_SIZE);
		expect(ROW_HEIGHT).toBeGreaterThan(BAR_HEIGHT);
	});

	it('computes task and milestone layout rows', () => {
		const mapper = createPixelMapper('day', new Date('2026-01-01T00:00:00.000Z'));
		const map = computeLayout(baseRows, mapper);

		const task = map.get(1);
		const milestone = map.get(2);
		expect(task).toBeDefined();
		expect(task?.x).toBe(0);
		expect(task?.height).toBe(BAR_HEIGHT);
		expect(task?.width).toBe(216);
		expect(task?.progressWidth).toBe(108);

		expect(milestone).toBeDefined();
		expect(milestone?.width).toBe(0);
		expect(milestone?.kind).toBe('milestone');
	});

	it('clamps progress and enforces minimum width for non-milestones', () => {
		const mapper = createPixelMapper('day', new Date('2026-01-01T00:00:00.000Z'));
		const rows: TaskNode[] = [
			{
				id: 9,
				text: 'Tiny',
				startDate: '2026-01-01',
				endDate: '2026-01-01',
				percentComplete: 900,
				kind: 'task',
				depth: 0,
				children: [],
			},
		];
		const layout = computeLayout(rows, mapper).get(9);
		expect(layout?.width).toBe(72);
		expect(layout?.progressWidth).toBe(72);
	});

	it('returns total content height from row count', () => {
		expect(totalContentHeight(3)).toBe(3 * ROW_HEIGHT);
	});

	it('derives viewport across all tasks with padding', () => {
		const [start, end] = deriveViewport(baseRows, 48);
		expect(start.toISOString()).toBe('2025-12-30T00:00:00.000Z');
		expect(end.toISOString()).toBe('2026-01-05T00:00:00.000Z');
	});

	it('returns default viewport when there are no tasks', () => {
		const [start, end] = deriveViewport([]);
		expect(end.getTime()).toBeGreaterThan(start.getTime());
	});
});
