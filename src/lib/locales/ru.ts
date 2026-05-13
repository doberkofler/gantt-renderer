import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'ru',
	labels: {
		ariaTask: 'Задача {0}',
		ariaMilestone: 'Веха {0}',
		addSubtaskTitle: 'Добавить подзадачу',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Название задачи',
		columnStartDate: 'Начало',
		columnEndDate: 'Конец',
		columnDuration: 'Длительность',
		columnQuarter: 'Кв',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
