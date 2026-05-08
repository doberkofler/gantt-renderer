import {describe, expect, it} from 'vitest';
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

	it('handles collapseAll and expandAll for empty trees', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = new GanttChart(container);
		instance.update({tasks: [], links: []});
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(0);

		instance.collapseAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(0);

		instance.expandAll();
		expect(container.querySelectorAll('[role="row"]')).toHaveLength(0);
	});
});
