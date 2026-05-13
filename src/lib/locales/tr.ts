import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'tr',
	labels: {
		ariaTask: 'Görev {0}',
		ariaMilestone: 'Kilometre taşı {0}',
		addSubtaskTitle: 'Alt görev ekle',
		columnTaskName: 'Görev adı',
		columnStartDate: 'Başlangıç',
		columnEndDate: 'Bitiş',
		columnDuration: 'Süre',
		columnQuarter: 'Çeyrek',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
