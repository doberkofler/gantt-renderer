import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'lv',
	labels: {
		ariaTask: 'Uzdevums {0}',
		ariaMilestone: 'Pavērsiens {0}',
		addSubtaskTitle: 'Pievienot apakšuzdevumu',
		columnTaskName: 'Uzdevuma nosaukums',
		columnStartDate: 'Sākums',
		columnEndDate: 'Beigas',
		columnDuration: 'Ilgums',
		columnQuarter: 'Cet.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
