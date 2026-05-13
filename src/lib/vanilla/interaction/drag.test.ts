import {describe, expect, it} from 'vitest';
import {toTask, bindMilestoneTask, attachMilestoneClick} from './drag.ts';
import {type TaskNode} from '../../domain/tree.ts';
import {type Task} from '../../validation/schemas.ts';

function makeNode(overrides: Partial<TaskNode>): TaskNode {
	return {
		id: 1,
		text: 'Test',
		startDate: '2026-01-01',
		endDate: '2026-01-03',
		percentComplete: 50,
		kind: 'task',
		children: [],
		depth: 0,
		...overrides,
	} as TaskNode;
}

describe('toTask', () => {
	it('converts a task node', () => {
		const node = makeNode({kind: 'task', parent: 2, color: '#ff0000', readonly: true, data: {priority: 'high'}});
		const result = toTask(node);
		expect(result).toMatchObject({
			id: 1,
			text: 'Test',
			startDate: '2026-01-01',
			kind: 'task',
			endDate: '2026-01-03',
			percentComplete: 50,
			parent: 2,
			color: '#ff0000',
			readonly: true,
			data: {priority: 'high'},
		});
	});

	it('converts a project node', () => {
		const node = makeNode({kind: 'project', open: true});
		const result = toTask(node);
		expect(result).toMatchObject({
			id: 1,
			kind: 'project',
			endDate: '2026-01-03',
			percentComplete: 50,
			open: true,
		});
	});

	it('converts a milestone node', () => {
		const node = makeNode({kind: 'milestone'});
		const result = toTask(node);
		expect(result).toMatchObject({
			id: 1,
			kind: 'milestone',
		});
		expect('endDate' in result).toBe(false);
		expect('percentComplete' in result).toBe(false);
	});

	it('omits optional fields when not set', () => {
		const node = makeNode({kind: 'task'});
		const result = toTask(node);
		expect('parent' in result).toBe(false);
		expect('color' in result).toBe(false);
		expect('readonly' in result).toBe(false);
		expect('data' in result).toBe(false);
	});
});

describe('bindMilestoneTask', () => {
	it('stores task reference on the DOM element', () => {
		const diamond = document.createElement('div');
		const task: Task = {id: 42, text: 'MS', startDate: '2026-06-01', kind: 'milestone'};
		bindMilestoneTask(diamond, task);
		expect((diamond as HTMLElement & {__task?: Task}).__task).toBe(task);
	});
});

describe('attachMilestoneClick', () => {
	it('calls onTaskClick on click', () => {
		const diamond = document.createElement('div');
		const calls: number[] = [];
		const cbs = {onTaskClick: (id: number): void => void calls.push(id)};
		const cleanup = attachMilestoneClick(diamond, 7, cbs);
		diamond.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		expect(calls).toStrictEqual([7]);
		cleanup();
	});

	it('calls onTaskDoubleClick on double click', () => {
		const diamond = document.createElement('div');
		const task: Task = {id: 42, text: 'MS', startDate: '2026-06-01', kind: 'milestone'};
		bindMilestoneTask(diamond, task);
		const doubleCalls: {id: number; task: Task}[] = [];
		const cbs = {onTaskDoubleClick: (payload: {id: number; task: Task}): void => void doubleCalls.push(payload)};
		const cleanup = attachMilestoneClick(diamond, 42, cbs);
		diamond.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 2}));
		expect(doubleCalls).toHaveLength(1);
		expect(doubleCalls[0]?.id).toBe(42);
		expect(doubleCalls[0]?.task).toBe(task);
		cleanup();
	});

	it('ignores double click when task is not bound', () => {
		const diamond = document.createElement('div');
		const doubleCalls: {id: number; task: Task}[] = [];
		const cbs = {onTaskDoubleClick: (payload: {id: number; task: Task}): void => void doubleCalls.push(payload)};
		const cleanup = attachMilestoneClick(diamond, 42, cbs);
		expect(() => {
			diamond.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 2}));
		}).not.toThrow();
		expect(doubleCalls).toHaveLength(0);
		cleanup();
	});

	it('cleans up listeners', () => {
		const diamond = document.createElement('div');
		const calls: number[] = [];
		const cbs = {onTaskClick: (id: number): void => void calls.push(id)};
		const cleanup = attachMilestoneClick(diamond, 7, cbs);
		cleanup();
		diamond.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		expect(calls).toStrictEqual([]);
	});
});
