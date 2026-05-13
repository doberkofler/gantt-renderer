import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'id',
	labels: {
		ariaTask: 'Tugas {0}',
		ariaMilestone: 'Tonggak {0}',
		addSubtaskTitle: 'Tambah subtugas',
		columnTaskName: 'Nama tugas',
		columnStartDate: 'Mulai',
		columnEndDate: 'Selesai',
		columnDuration: 'Durasi',
		columnQuarter: 'Kuartal',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
