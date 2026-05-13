import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'el',
	labels: {
		ariaTask: 'Εργασία {0}',
		ariaMilestone: 'Ορόσημο {0}',
		addSubtaskTitle: 'Προσθήκη υποεργασίας',
		columnTaskName: 'Όνομα εργασίας',
		columnStartDate: 'Έναρξη',
		columnEndDate: 'Λήξη',
		columnDuration: 'Διάρκεια',
		columnQuarter: 'Τρ.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
