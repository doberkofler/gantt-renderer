import {describe, expect, it} from 'vitest';
import {buildTaskTree, flattenTree, isParent} from './tree.ts';
import {type Task} from '../validation/schemas.ts';

const tasks: Task[] = [
	{id: 1, text: 'Root', startDate: '2026-01-01', duration: 5, progress: 0, type: 'project', open: true},
	{id: 2, text: 'Child A', startDate: '2026-01-02', duration: 2, parent: 1, progress: 0, type: 'task', open: true},
	{id: 3, text: 'Child B', startDate: '2026-01-03', duration: 1, parent: 1, progress: 0, type: 'task', open: true},
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
		const broken: Task[] = [{id: 1, text: 'Task', startDate: '2026-01-01', duration: 1, parent: 999, progress: 0, type: 'task', open: true}];
		expect(() => buildTaskTree(broken)).toThrow('references non-existent parent');
	});

	it('flattens only expanded branches', () => {
		const roots = buildTaskTree(tasks);
		expect(flattenTree(roots, new Set())).toHaveLength(1);
		expect(flattenTree(roots, new Set([1])).map((n) => n.id)).toEqual([1, 2, 3]);
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
});
