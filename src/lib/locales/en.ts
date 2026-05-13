import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'en',
	labels: {
		ariaTask: 'Task {0}',
		ariaMilestone: 'Milestone {0}',
		addSubtaskTitle: 'Add subtask',
		columnTaskName: 'Task name',
		columnStartDate: 'Start',
		columnEndDate: 'End',
		columnDuration: 'Duration',
		columnQuarter: 'Q',
	},
	weekStartsOn: 0,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
