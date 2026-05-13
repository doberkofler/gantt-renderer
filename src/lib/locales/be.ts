import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'be',
	labels: {
		ariaTask: 'Задача {0}',
		ariaMilestone: 'Веха {0}',
		addSubtaskTitle: 'Дадаць падзадачу',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Назва задачы',
		columnStartDate: 'Пачатак',
		columnEndDate: 'Канец',
		columnDuration: 'Працягласць',
		columnQuarter: 'Кв.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
