import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'zh-Hant',
	labels: {
		ariaTask: '任務 {0}',
		ariaMilestone: '里程碑 {0}',
		addSubtaskTitle: '新增子任務',
		columnTaskName: '任務名稱',
		columnStartDate: '開始',
		columnEndDate: '結束',
		columnDuration: '工期',
		columnQuarter: '季',
	},
	weekStartsOn: 1,
	weekNumbering: 'us',
	weekendDays: [0, 6],
};
