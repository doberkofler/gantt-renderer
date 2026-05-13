import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'nb',
	labels: {
		ariaTask: 'Oppgave {0}',
		ariaMilestone: 'Milepæl {0}',
		addSubtaskTitle: 'Legg til deloppgave',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Oppgavenavn',
		columnStartDate: 'Start',
		columnEndDate: 'Slutt',
		columnDuration: 'Varighet',
		columnQuarter: 'Kv.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
