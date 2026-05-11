import {describe, expect, it} from 'vitest';
import {buildTaskTree, flattenTree, isParent} from './tree.ts';
import {type Task} from '../validation/schemas.ts';

const tasks: Task[] = [
	{id: 1, text: 'Root', startDate: '2026-01-01', endDate: '2026-01-06', percentComplete: 0, kind: 'project', open: true},
	{id: 2, text: 'Child A', startDate: '2026-01-02', endDate: '2026-01-04', parent: 1, percentComplete: 0, kind: 'task'},
	{id: 3, text: 'Child B', startDate: '2026-01-03', endDate: '2026-01-04', parent: 1, percentComplete: 0, kind: 'task'},
];

describe('tree utilities', () => {
	it('builds tree and assigns depth', () => {
		const roots = buildTaskTree(tasks);
		expect(roots).toHaveLength(1);
		expect(roots[0]?.depth).toBe(0);
		expect(roots[0]?.children).toHaveLength(2);
		expect(roots[0]?.children[0]?.depth).toBe(1);
	});

	it('throws when parent id does not exist', () => {
		const broken: Task[] = [{id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-02', parent: 999, percentComplete: 0, kind: 'task'}];
		expect(() => buildTaskTree(broken)).toThrow('references non-existent parent');
	});

	it('flattens only expanded branches', () => {
		const roots = buildTaskTree(tasks);
		expect(flattenTree(roots, new Set())).toHaveLength(1);
		expect(flattenTree(roots, new Set([1])).map((n) => n.id)).toStrictEqual([1, 2, 3]);
	});

	it('detects parent nodes', () => {
		const roots = buildTaskTree(tasks);
		const [root] = roots;
		expect(root).toBeDefined();
		if (root === undefined) {
			throw new Error('Expected root node');
		}
		const [leaf] = root.children;
		expect(leaf).toBeDefined();
		if (leaf === undefined) {
			throw new Error('Expected leaf node');
		}
		expect(isParent(root)).toBe(true);
		expect(isParent(leaf)).toBe(false);
	});

	it('throws when parent points to a milestone', () => {
		const broken: Task[] = [
			{id: 1, text: 'Ms', startDate: '2026-01-01', kind: 'milestone'},
			{id: 2, text: 'Child', startDate: '2026-01-01', endDate: '2026-01-02', percentComplete: 0, kind: 'task', parent: 1},
		];
		expect(() => buildTaskTree(broken)).toThrow("kind 'milestone'");
	});

	it('throws when parent points to a leaf task', () => {
		const broken: Task[] = [
			{id: 1, text: 'Leaf', startDate: '2026-01-01', endDate: '2026-01-02', percentComplete: 0, kind: 'task'},
			{id: 2, text: 'Child', startDate: '2026-01-01', endDate: '2026-01-02', percentComplete: 0, kind: 'task', parent: 1},
		];
		expect(() => buildTaskTree(broken)).toThrow("kind 'task'");
	});
});
