import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'sr',
	labels: {
		ariaTask: 'Задатак {0}',
		ariaMilestone: 'Прекретница {0}',
		addSubtaskTitle: 'Додај подзадатак',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Назив задатка',
		columnStartDate: 'Почетак',
		columnEndDate: 'Крај',
		columnDuration: 'Трајање',
		columnQuarter: 'Кв.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
