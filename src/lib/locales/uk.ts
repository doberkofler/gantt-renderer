import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'uk',
	labels: {
		ariaTask: 'Завдання {0}',
		ariaMilestone: 'Віха {0}',
		addSubtaskTitle: 'Додати підзавдання',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Назва завдання',
		columnStartDate: 'Початок',
		columnEndDate: 'Кінець',
		columnDuration: 'Тривалість',
		columnQuarter: 'Кв',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
