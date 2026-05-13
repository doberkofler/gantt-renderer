import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'it',
	labels: {
		ariaTask: 'Attività {0}',
		ariaMilestone: 'Pietra miliare {0}',
		addSubtaskTitle: 'Aggiungi sottoattività',
		columnTaskName: 'Nome attività',
		columnStartDate: 'Inizio',
		columnEndDate: 'Fine',
		columnDuration: 'Durata',
		columnQuarter: 'T',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
