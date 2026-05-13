import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'ja',
	labels: {
		ariaTask: 'タスク {0}',
		ariaMilestone: 'マイルストーン {0}',
		addSubtaskTitle: 'サブタスクを追加',
		columnTaskName: 'タスク名',
		columnStartDate: '開始',
		columnEndDate: '終了',
		columnDuration: '期間',
		columnQuarter: 'Q',
	},
	weekStartsOn: 0,
	weekNumbering: 'us',
	weekendDays: [0, 6],
};
