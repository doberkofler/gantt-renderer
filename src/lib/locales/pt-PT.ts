import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'pt-PT',
	labels: {
		ariaTask: 'Tarefa {0}',
		ariaMilestone: 'Marco {0}',
		addSubtaskTitle: 'Adicionar subtarefa',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Nome da tarefa',
		columnStartDate: 'Início',
		columnEndDate: 'Fim',
		columnDuration: 'Duração',
		columnQuarter: 'T',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
