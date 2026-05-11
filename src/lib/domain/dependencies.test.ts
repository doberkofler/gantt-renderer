import {describe, expect, it} from 'vitest';
import {detectCycles, validateLinkRefs} from './dependencies.ts';
import {type Link, type Task} from '../validation/schemas.ts';

const tasks: Task[] = [
	{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-01', percentComplete: 0, kind: 'task'},
	{id: 2, text: 'B', startDate: '2026-01-02', endDate: '2026-01-02', percentComplete: 0, kind: 'task'},
	{id: 3, text: 'C', startDate: '2026-01-03', endDate: '2026-01-03', percentComplete: 0, kind: 'task'},
];

describe('dependency utilities', () => {
	it('accepts valid link references and acyclic graphs', () => {
		const links: Link[] = [
			{id: 1, source: 1, target: 2, type: 'FS'},
			{id: 2, source: 2, target: 3, type: 'FS'},
		];
		expect(() => {
			validateLinkRefs(tasks, links);
		}).not.toThrow();
		expect(() => {
			detectCycles(tasks, links);
		}).not.toThrow();
	});

	it('throws on missing source or target refs', () => {
		expect(() => {
			validateLinkRefs(tasks, [{id: 1, source: 99, target: 2, type: 'FS'}]);
		}).toThrow('source=99 not found');
		expect(() => {
			validateLinkRefs(tasks, [{id: 2, source: 1, target: 99, type: 'FS'}]);
		}).toThrow('target=99 not found');
	});

	it('throws when non-FS link connects to a milestone', () => {
		const milestoneTasks: Task[] = [
			{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-01', percentComplete: 0, kind: 'task'},
			{id: 2, text: 'M', startDate: '2026-01-02', kind: 'milestone'},
		];
		expect(() => {
			validateLinkRefs(milestoneTasks, [{id: 1, source: 1, target: 2, type: 'SS'}] as Link[]);
		}).toThrow("non-FS type 'SS'");
	});

	it('throws on duplicate link pairs', () => {
		const links: Link[] = [
			{id: 1, source: 1, target: 2, type: 'FS'},
			{id: 2, source: 1, target: 2, type: 'FS'},
		];
		expect(() => {
			validateLinkRefs(tasks, links);
		}).toThrow('duplicate pair');
	});
});
