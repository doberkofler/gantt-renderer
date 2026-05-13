import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'cs',
	labels: {
		ariaTask: 'Úkol {0}',
		ariaMilestone: 'Milník {0}',
		addSubtaskTitle: 'Přidat podúkol',
		columnTaskName: 'Název úkolu',
		columnStartDate: 'Začátek',
		columnEndDate: 'Konec',
		columnDuration: 'Trvání',
		columnQuarter: 'Q',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
