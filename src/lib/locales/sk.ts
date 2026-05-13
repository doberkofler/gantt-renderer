import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'sk',
	labels: {
		ariaTask: 'Úloha {0}',
		ariaMilestone: 'Míľnik {0}',
		addSubtaskTitle: 'Pridať podúlohu',
		columnTaskName: 'Názov úlohy',
		columnStartDate: 'Začiatok',
		columnEndDate: 'Koniec',
		columnDuration: 'Trvanie',
		columnQuarter: 'Q',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
