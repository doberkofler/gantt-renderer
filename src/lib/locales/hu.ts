import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'hu',
	labels: {
		ariaTask: 'Feladat {0}',
		ariaMilestone: 'Mérföldkő {0}',
		addSubtaskTitle: 'Részfeladat hozzáadása',
		columnTaskName: 'Feladat neve',
		columnStartDate: 'Kezdés',
		columnEndDate: 'Befejezés',
		columnDuration: 'Időtartam',
		columnQuarter: 'N.év',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
