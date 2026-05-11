import {afterEach, beforeEach} from 'vitest';
import {GanttChart, type GanttOptions, type GanttCallbacks} from './gantt-chart.ts';
import {type GanttInput} from '../validation/schemas.ts';

export const INPUT: GanttInput = {
	tasks: [
		{id: 1, text: 'Customer Portal Release', startDate: '2026-02-01', endDate: '2026-02-13', percentComplete: 40, kind: 'project', open: true},
		{id: 2, text: 'Discovery Sprint', startDate: '2026-02-01', endDate: '2026-02-04', percentComplete: 90, kind: 'task', parent: 1},
		{id: 3, text: 'API Implementation', startDate: '2026-02-04', endDate: '2026-02-09', percentComplete: 45, kind: 'task', parent: 1},
		{id: 4, text: 'Frontend Implementation', startDate: '2026-02-05', endDate: '2026-02-10', percentComplete: 30, kind: 'task', parent: 1},
		{id: 5, text: 'UAT Exit Milestone', startDate: '2026-02-12', kind: 'milestone', parent: 1},
	],
	links: [
		{id: 1, source: 2, target: 3, type: 'FS'},
		{id: 2, source: 3, target: 4, type: 'SS'},
		{id: 3, source: 4, target: 5, type: 'FS'},
	],
};

export const SPECIAL_DAYS = [
	{date: '2026-01-01', kind: 'holiday' as const, label: "New Year's Day"},
	{date: '2026-05-01', kind: 'holiday' as const, label: "International Workers' Day"},
	{date: '2026-05-25', kind: 'holiday' as const, label: 'Memorial Day', className: 'holiday-memorial-day'},
	{date: '2026-07-04', kind: 'holiday' as const, label: 'Independence Day'},
	{date: '2026-11-26', kind: 'holiday' as const, label: 'Thanksgiving Day'},
	{date: '2026-12-25', kind: 'holiday' as const, label: 'Christmas Day'},
	{date: '2026-02-11', kind: 'custom' as const, label: 'Release Freeze'},
];

export function createMountHelpers(): {
	mountTracked: (container: HTMLElement, input: GanttInput, opts?: GanttOptions, cbs?: GanttCallbacks) => GanttChart;
} {
	const instances: GanttChart[] = [];

	function mountTracked(container: HTMLElement, input: GanttInput, opts?: GanttOptions, cbs?: GanttCallbacks): GanttChart {
		const instance = new GanttChart(container, opts);
		if (cbs !== undefined) {
			instance.setCallbacks(cbs);
		}
		instance.update(input);
		instances.push(instance);
		return instance;
	}

	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		while (instances.length > 0) {
			instances.pop()?.destroy();
		}
		document.body.innerHTML = '';
	});

	return {mountTracked};
}
