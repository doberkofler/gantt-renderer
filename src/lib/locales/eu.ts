import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'eu',
	labels: {
		ariaTask: 'Ataza {0}',
		ariaMilestone: 'Mugarria {0}',
		addSubtaskTitle: 'Gehitu azpiataza',
		columnTaskName: 'Atazaren izena',
		columnStartDate: 'Hasiera',
		columnEndDate: 'Amaiera',
		columnDuration: 'Iraupena',
		columnQuarter: 'Lauh.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
