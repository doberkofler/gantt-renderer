import {afterEach, beforeEach} from 'vitest';
import {GanttChart, type GanttOptions} from './gantt-chart.ts';
import {type GanttInput} from '../validation/schemas.ts';

export const INPUT: GanttInput = {
	tasks: [
		{id: 1, text: 'Customer Portal Release', start_date: '2026-02-01', duration: 12, progress: 0.4, type: 'project', open: true},
		{id: 2, text: 'Discovery Sprint', start_date: '2026-02-01', duration: 3, progress: 0.9, type: 'task', parent: 1, open: true},
		{id: 3, text: 'API Implementation', start_date: '2026-02-04', duration: 5, progress: 0.45, type: 'task', parent: 1, open: true},
		{id: 4, text: 'Frontend Implementation', start_date: '2026-02-05', duration: 5, progress: 0.3, type: 'task', parent: 1, open: true},
		{id: 5, text: 'UAT Exit Milestone', start_date: '2026-02-12', duration: 0, progress: 0, type: 'milestone', parent: 1, open: true},
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
	mountTracked: (container: HTMLElement, input: GanttInput, opts?: GanttOptions) => GanttChart;
} {
	const instances: GanttChart[] = [];

	function mountTracked(container: HTMLElement, input: GanttInput, opts?: GanttOptions): GanttChart {
		const instance = new GanttChart(container, opts);
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
