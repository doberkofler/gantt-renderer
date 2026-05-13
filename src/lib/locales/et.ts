import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'et',
	labels: {
		ariaTask: 'Ülesanne {0}',
		ariaMilestone: 'Verstapost {0}',
		addSubtaskTitle: 'Lisa alamülesanne',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Ülesande nimi',
		columnStartDate: 'Algus',
		columnEndDate: 'Lõpp',
		columnDuration: 'Kestus',
		columnQuarter: 'Kv',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
