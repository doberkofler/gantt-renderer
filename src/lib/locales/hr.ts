import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'hr',
	labels: {
		ariaTask: 'Zadatak {0}',
		ariaMilestone: 'Prekretnica {0}',
		addSubtaskTitle: 'Dodaj podzadatak',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Naziv zadatka',
		columnStartDate: 'Početak',
		columnEndDate: 'Kraj',
		columnDuration: 'Trajanje',
		columnQuarter: 'Kv.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
