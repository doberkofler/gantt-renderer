import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'mk',
	labels: {
		ariaTask: 'Задача {0}',
		ariaMilestone: 'Пресвртница {0}',
		addSubtaskTitle: 'Додај подзадача',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Име на задача',
		columnStartDate: 'Почеток',
		columnEndDate: 'Крај',
		columnDuration: 'Времетраење',
		columnQuarter: 'Кв.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
