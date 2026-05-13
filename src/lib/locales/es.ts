import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'es',
	labels: {
		ariaTask: 'Tarea {0}',
		ariaMilestone: 'Hito {0}',
		addSubtaskTitle: 'Añadir subtarea',
		columnTaskName: 'Nombre de tarea',
		columnStartDate: 'Inicio',
		columnEndDate: 'Fin',
		columnDuration: 'Duración',
		columnQuarter: 'T',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
