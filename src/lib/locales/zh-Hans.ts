import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'zh-Hans',
	labels: {
		ariaTask: '任务 {0}',
		ariaMilestone: '里程碑 {0}',
		addSubtaskTitle: '添加子任务',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: '任务名称',
		columnStartDate: '开始',
		columnEndDate: '结束',
		columnDuration: '工期',
		columnQuarter: '季',
	},
	weekStartsOn: 1,
	weekNumbering: 'us',
	weekendDays: [0, 6],
};
