import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'sq',
	labels: {
		ariaTask: 'Detyrë {0}',
		ariaMilestone: 'Pikë referimi {0}',
		addSubtaskTitle: 'Shto nëndetyrë',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Emri i detyrës',
		columnStartDate: 'Fillimi',
		columnEndDate: 'Përfundimi',
		columnDuration: 'Kohëzgjatja',
		columnQuarter: 'Trem.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
