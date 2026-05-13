import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'lt',
	labels: {
		ariaTask: 'Užduotis {0}',
		ariaMilestone: 'Gairė {0}',
		addSubtaskTitle: 'Pridėti použduotę',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Užduoties pavadinimas',
		columnStartDate: 'Pradžia',
		columnEndDate: 'Pabaiga',
		columnDuration: 'Trukmė',
		columnQuarter: 'Ketv.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
