import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'th',
	labels: {
		ariaTask: 'งาน {0}',
		ariaMilestone: 'เหตุการณ์สำคัญ {0}',
		addSubtaskTitle: 'เพิ่มงานย่อย',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'ชื่องาน',
		columnStartDate: 'เริ่มต้น',
		columnEndDate: 'สิ้นสุด',
		columnDuration: 'ระยะเวลา',
		columnQuarter: 'ไตรมาส',
	},
	weekStartsOn: 1,
	weekNumbering: 'us',
	weekendDays: [0, 6],
};
