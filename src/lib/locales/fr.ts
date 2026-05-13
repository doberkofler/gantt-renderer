import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'fr',
	labels: {
		ariaTask: 'Tâche {0}',
		ariaMilestone: 'Jalon {0}',
		addSubtaskTitle: 'Ajouter une sous-tâche',
		columnTaskName: 'Nom de la tâche',
		columnStartDate: 'Début',
		columnEndDate: 'Fin',
		columnDuration: 'Durée',
		columnQuarter: 'T',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
