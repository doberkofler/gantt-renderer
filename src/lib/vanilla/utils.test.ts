import {describe, expect, it} from 'vitest';
import {buildTaskIndex, toIsoDate, buildSpecialDayIndex, normalizeWeekendDays, getExpandableTaskIds, getInitialExpandedIds} from './utils.ts';
import {type SpecialDay, type Task} from '../validation/schemas.ts';

describe('utils', () => {
	describe('buildTaskIndex', () => {
		it('maps task ids to array indices', () => {
			const tasks: Task[] = [
				{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-01', percentComplete: 0, kind: 'task'},
				{id: 5, text: 'B', startDate: '2026-01-02', endDate: '2026-01-03', percentComplete: 0, kind: 'task'},
				{id: 3, text: 'C', startDate: '2026-01-03', endDate: '2026-01-05', percentComplete: 0, kind: 'task'},
			];
			const index = buildTaskIndex(tasks);
			expect(index.get(1)).toBe(0);
			expect(index.get(5)).toBe(1);
			expect(index.get(3)).toBe(2);
			expect(index.get(99)).toBeUndefined();
		});

		it('returns empty map for empty array', () => {
			expect(buildTaskIndex([]).size).toBe(0);
		});
	});

	describe('toIsoDate', () => {
		it('converts Date to YYYY-MM-DD string', () => {
			expect(toIsoDate(new Date('2026-01-15T14:30:00.000Z'))).toBe('2026-01-15');
			expect(toIsoDate(new Date('2026-12-31T23:59:59.000Z'))).toBe('2026-12-31');
		});
	});

	describe('buildSpecialDayIndex', () => {
		it('parses and indexes special days by ISO date', () => {
			const days: SpecialDay[] = [
				{date: '2026-01-01', kind: 'holiday', label: "New Year's"},
				{date: '2026-07-04', kind: 'custom', className: 'independence'},
			];
			const map = buildSpecialDayIndex(days);
			expect(map.get('2026-01-01')).toMatchObject({kind: 'holiday', label: "New Year's"});
			expect(map.get('2026-07-04')).toMatchObject({kind: 'custom', className: 'independence'});
		});

		it('returns empty map for empty array', () => {
			expect(buildSpecialDayIndex([]).size).toBe(0);
		});
	});

	describe('normalizeWeekendDays', () => {
		it('returns default [0, 6] when undefined', () => {
			expect(normalizeWeekendDays(undefined)).toStrictEqual(new Set([0, 6]));
		});

		it('normalizes custom weekend days', () => {
			expect(normalizeWeekendDays([5, 6])).toStrictEqual(new Set([5, 6]));
			expect(normalizeWeekendDays([0])).toStrictEqual(new Set([0]));
		});

		it('throws on invalid day values', () => {
			expect(() => normalizeWeekendDays([7])).toThrow('weekendDays must contain integers in range 0..6');
			expect(() => normalizeWeekendDays([-1])).toThrow('weekendDays must contain integers in range 0..6');
			expect(() => normalizeWeekendDays([1.5])).toThrow('weekendDays must contain integers in range 0..6');
		});
	});

	describe('getExpandableTaskIds', () => {
		it('returns ids of tasks with children', () => {
			const tasks: Task[] = [
				{id: 1, text: 'Root', startDate: '2026-01-01', endDate: '2026-01-05', percentComplete: 0, kind: 'project', open: true},
				{id: 2, text: 'Child', startDate: '2026-01-01', endDate: '2026-01-03', percentComplete: 0, kind: 'task', parent: 1},
				{id: 3, text: 'Leaf', startDate: '2026-01-01', endDate: '2026-01-02', percentComplete: 0, kind: 'task'},
			];
			const ids = getExpandableTaskIds(tasks);
			expect(ids.has(1)).toBe(true);
			expect(ids.has(2)).toBe(false);
			expect(ids.has(3)).toBe(false);
		});

		it('returns empty set when no tasks have children', () => {
			const tasks: Task[] = [{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-01', percentComplete: 0, kind: 'task'}];
			expect(getExpandableTaskIds(tasks).size).toBe(0);
		});
	});

	describe('getInitialExpandedIds', () => {
		it('returns ids of tasks marked open that have children', () => {
			const tasks: Task[] = [
				{id: 1, text: 'Root', startDate: '2026-01-01', endDate: '2026-01-05', percentComplete: 0, kind: 'project', open: true},
				{id: 2, text: 'Child', startDate: '2026-01-01', endDate: '2026-01-03', percentComplete: 0, kind: 'task', parent: 1},
				{id: 3, text: 'Closed', startDate: '2026-01-01', endDate: '2026-01-05', percentComplete: 0, kind: 'project', open: false},
				{id: 4, text: 'Child2', startDate: '2026-01-01', endDate: '2026-01-03', percentComplete: 0, kind: 'task', parent: 3},
			];
			const ids = getInitialExpandedIds(tasks);
			expect(ids.has(1)).toBe(true);
			expect(ids.has(3)).toBe(false);
		});

		it('returns empty set for empty task list', () => {
			expect(getInitialExpandedIds([]).size).toBe(0);
		});
	});
});
