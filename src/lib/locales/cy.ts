import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'cy',
	labels: {
		ariaTask: 'Tasg {0}',
		ariaMilestone: 'Carreg filltir {0}',
		addSubtaskTitle: 'Ychwanegu is-dasg',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: "Enw'r dasg",
		columnStartDate: 'Dechrau',
		columnEndDate: 'Gorffen',
		columnDuration: 'Hyd',
		columnQuarter: 'Chw.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
