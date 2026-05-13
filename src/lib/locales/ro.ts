import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'ro',
	labels: {
		ariaTask: 'Sarcină {0}',
		ariaMilestone: 'Jalon {0}',
		addSubtaskTitle: 'Adaugă subsarcină',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Nume sarcină',
		columnStartDate: 'Început',
		columnEndDate: 'Sfârșit',
		columnDuration: 'Durată',
		columnQuarter: 'Trim.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
