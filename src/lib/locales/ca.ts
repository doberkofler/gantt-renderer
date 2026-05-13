import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'ca',
	labels: {
		ariaTask: 'Tasca {0}',
		ariaMilestone: 'Fita {0}',
		addSubtaskTitle: 'Afegeix subtasca',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Nom de la tasca',
		columnStartDate: 'Inici',
		columnEndDate: 'Fi',
		columnDuration: 'Durada',
		columnQuarter: 'T',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
