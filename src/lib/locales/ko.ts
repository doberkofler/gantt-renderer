import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'ko',
	labels: {
		ariaTask: '작업 {0}',
		ariaMilestone: '마일스톤 {0}',
		addSubtaskTitle: '하위 작업 추가',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: '작업 이름',
		columnStartDate: '시작',
		columnEndDate: '종료',
		columnDuration: '기간',
		columnQuarter: '분기',
	},
	weekStartsOn: 0,
	weekNumbering: 'us',
	weekendDays: [0, 6],
};
