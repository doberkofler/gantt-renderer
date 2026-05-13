import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'sl',
	labels: {
		ariaTask: 'Naloga {0}',
		ariaMilestone: 'Mejnik {0}',
		addSubtaskTitle: 'Dodaj podnalogo',
		columnTaskName: 'Ime naloge',
		columnStartDate: 'Začetek',
		columnEndDate: 'Konec',
		columnDuration: 'Trajanje',
		columnQuarter: 'Četr.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
