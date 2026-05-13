import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'bg',
	labels: {
		ariaTask: 'Задача {0}',
		ariaMilestone: 'Крайъгълен камък {0}',
		addSubtaskTitle: 'Добавяне на подзадача',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Име на задача',
		columnStartDate: 'Начало',
		columnEndDate: 'Край',
		columnDuration: 'Продължителност',
		columnQuarter: 'Тр.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
