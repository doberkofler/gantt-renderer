import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'pl',
	labels: {
		ariaTask: 'Zadanie {0}',
		ariaMilestone: 'Kamień milowy {0}',
		addSubtaskTitle: 'Dodaj podzadanie',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Nazwa zadania',
		columnStartDate: 'Początek',
		columnEndDate: 'Koniec',
		columnDuration: 'Czas trwania',
		columnQuarter: 'Kw.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
