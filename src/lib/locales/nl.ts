import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'nl',
	labels: {
		ariaTask: 'Taak {0}',
		ariaMilestone: 'Mijlpaal {0}',
		addSubtaskTitle: 'Subtaak toevoegen',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Taaknaam',
		columnStartDate: 'Start',
		columnEndDate: 'Einde',
		columnDuration: 'Duur',
		columnQuarter: 'Kw.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
