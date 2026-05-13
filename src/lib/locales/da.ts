import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'da',
	labels: {
		ariaTask: 'Opgave {0}',
		ariaMilestone: 'Milepæl {0}',
		addSubtaskTitle: 'Tilføj delopgave',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Opgavenavn',
		columnStartDate: 'Start',
		columnEndDate: 'Slut',
		columnDuration: 'Varighed',
		columnQuarter: 'Kvt.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
