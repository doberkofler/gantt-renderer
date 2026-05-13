import {describe, expect, it, vi} from 'vitest';
import {GanttChart} from './gantt-chart.ts';
import {INPUT} from './gantt-chart.test-utils.ts';

describe('api lifecycle', () => {
	it('supports api calls and cleans up on destroy', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = new GanttChart(container);
		instance.update(INPUT);
		instance.setOptions({scale: 'year'});
		instance.setOptions({scale: 'quarter'});
		instance.setOptions({scale: 'month'});
		instance.setOptions({scale: 'week'});
		instance.setOptions({scale: 'day'});
		instance.setOptions({scale: 'hour'});
		instance.select(2);
		instance.select(null);
		instance.collapseAll();
		instance.expandAll();

		instance.destroy();
		expect(container.childNodes).toHaveLength(0);
	});

	it('collapses and expands all groups through public api methods', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = new GanttChart(container);
		instance.update(INPUT);
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(5);

		instance.collapseAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);

		instance.expandAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(5);
	});

	it('keeps collapseAll and expandAll idempotent', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = new GanttChart(container);
		instance.update(INPUT);

		instance.collapseAll();
		instance.collapseAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);

		instance.expandAll();
		instance.expandAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(5);
	});

	it('handles collapseAll and expandAll for flat trees', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = new GanttChart(container);
		instance.update({tasks: [{id: 1, text: 'X', startDate: '2026-01-01', endDate: '2026-01-02', kind: 'task'}]});
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);

		instance.collapseAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);

		instance.expandAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);
	});

	it('fires onExpandCollapseAll on expandAll with changed tasks', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const onExpandCollapseAll = vi.fn<(_p: {tasks: {id: number; kind: string}[]; instance: unknown}) => void>();
		const instance = new GanttChart(container);
		instance.setCallbacks({onExpandCollapseAll});
		instance.update(INPUT);

		instance.collapseAll();
		onExpandCollapseAll.mockClear();
		instance.expandAll();

		expect(onExpandCollapseAll).toHaveBeenCalledWith(
			expect.objectContaining({
				tasks: expect.arrayContaining([expect.objectContaining({id: 1, kind: 'project'})]),
			}),
		);
	});

	it('fires onExpandCollapseAll on collapseAll with changed tasks', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const onExpandCollapseAll = vi.fn<(_p: {tasks: {id: number; kind: string}[]; instance: unknown}) => void>();
		const instance = new GanttChart(container);
		instance.setCallbacks({onExpandCollapseAll});
		instance.update(INPUT);

		instance.collapseAll();

		expect(onExpandCollapseAll).toHaveBeenCalledWith(
			expect.objectContaining({
				tasks: [expect.objectContaining({id: 1, kind: 'project', open: false})],
			}),
		);
	});

	it('does not fire onExpandCollapseAll when no state change', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const onExpandCollapseAll = vi.fn<() => void>();
		const instance = new GanttChart(container);
		instance.setCallbacks({onExpandCollapseAll});
		instance.update(INPUT);

		onExpandCollapseAll.mockClear();
		instance.expandAll();
		expect(onExpandCollapseAll).not.toHaveBeenCalled();

		instance.collapseAll();
		onExpandCollapseAll.mockClear();
		instance.collapseAll();
		expect(onExpandCollapseAll).not.toHaveBeenCalled();
	});
});
