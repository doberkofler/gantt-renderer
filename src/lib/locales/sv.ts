import {type ChartLocale} from '../locale.ts';

export const CHART_LOCALE: ChartLocale = {
	code: 'sv',
	labels: {
		ariaTask: 'Uppgift {0}',
		ariaMilestone: 'Milstolpe {0}',
		addSubtaskTitle: 'Lägg till deluppgift',
		expandAllTitle: 'Expand all',
		collapseAllTitle: 'Collapse all',
		columnTaskName: 'Uppgiftsnamn',
		columnStartDate: 'Start',
		columnEndDate: 'Slut',
		columnDuration: 'Varaktighet',
		columnQuarter: 'Kv.',
	},
	weekStartsOn: 1,
	weekNumbering: 'iso',
	weekendDays: [0, 6],
};
