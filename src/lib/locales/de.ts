import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'de',
	labels: {
		ariaTask: 'Aufgabe {0}',
		ariaMilestone: 'Meilenstein {0}',
		addSubtaskTitle: 'Teilaufgabe hinzufügen',
		columnTaskName: 'Aufgabenname',
		columnStartDate: 'Start',
		columnEndDate: 'Ende',
		columnDuration: 'Dauer',
		columnQuarter: 'Q',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
