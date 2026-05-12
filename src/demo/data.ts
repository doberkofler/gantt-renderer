import {type GanttInputRaw} from '../lib/index.ts';

export type DemoTaskData = {
	owner: string;
	priority: 'low' | 'medium' | 'high';
};

export type DemoLinkData = {
	label: string;
};

/** Raw input matching the screenshots. Validated at runtime via parseGanttInput. */
export const RAW_INPUT = {
	tasks: [
		{
			id: 1000,
			text: 'Enterprise CRM Rollout',
			startDate: '2026-01-06',
			endDate: '2026-07-04',
			kind: 'project',
			open: true,
			percentComplete: 32,
			data: {owner: 'alice', priority: 'high'},
		},
		{id: 1100, text: 'Discovery and Planning', startDate: '2026-01-06', endDate: '2026-01-27', parent: 1000, kind: 'project', open: true, percentComplete: 78},
		{
			id: 1110,
			text: 'Stakeholder Interviews',
			startDate: '2026-01-06',
			endDate: '2026-01-12',
			parent: 1100,
			kind: 'task',
			percentComplete: 100,
			data: {owner: 'bob', priority: 'high'},
		},
		{id: 1120, text: 'Requirements Backlog', startDate: '2026-01-10', endDate: '2026-01-19', parent: 1100, kind: 'task', percentComplete: 92},
		{id: 1130, text: 'Solution Architecture Blueprint', startDate: '2026-01-15', endDate: '2026-01-22', parent: 1100, kind: 'task', percentComplete: 70},
		{id: 1140, text: 'Design Sign-Off', startDate: '2026-01-28', parent: 1100, kind: 'milestone', data: {owner: 'alice', priority: 'high'}},
		{id: 1200, text: 'Build and Configuration', startDate: '2026-01-20', endDate: '2026-02-28', parent: 1000, kind: 'project', open: true, percentComplete: 41},
		{
			id: 1210,
			text: 'Core API Development',
			startDate: '2026-01-20',
			endDate: '2026-02-03',
			parent: 1200,
			kind: 'task',
			percentComplete: 66,
			data: {owner: 'carol', priority: 'medium'},
		},
		{id: 1220, text: 'UI Component Implementation', startDate: '2026-01-23', endDate: '2026-02-09', parent: 1200, kind: 'task', percentComplete: 50},
		{id: 1230, text: 'Data Migration Pipeline', startDate: '2026-01-25', endDate: '2026-02-07', parent: 1200, kind: 'task', percentComplete: 38},
		{id: 1300, text: 'System Integrations', startDate: '2026-02-03', endDate: '2026-02-27', parent: 1000, kind: 'project', open: true, percentComplete: 27},
		{id: 1310, text: 'Identity Provider Integration', startDate: '2026-02-03', endDate: '2026-02-11', parent: 1300, kind: 'task', percentComplete: 52},
		{id: 1320, text: 'Notification Service Integration', startDate: '2026-02-06', endDate: '2026-02-13', parent: 1300, kind: 'task', percentComplete: 40},
		{id: 1330, text: 'Analytics Event Mapping', startDate: '2026-02-08', endDate: '2026-02-14', parent: 1300, kind: 'task', percentComplete: 25},
		{id: 1340, text: 'Billing Workstream', startDate: '2026-02-10', endDate: '2026-02-22', parent: 1300, kind: 'project', open: true, percentComplete: 20},
		{id: 1341, text: 'Billing Connector', startDate: '2026-02-10', endDate: '2026-02-15', parent: 1340, kind: 'task', percentComplete: 35},
		{id: 1342, text: 'Invoice Reconciliation Logic', startDate: '2026-02-14', endDate: '2026-02-20', parent: 1340, kind: 'task', percentComplete: 10},
		{id: 1400, text: 'Validation and Release', startDate: '2026-05-01', endDate: '2026-06-21', parent: 1000, kind: 'project', open: true, percentComplete: 12},
		{id: 1410, text: 'Integration Test Suite', startDate: '2026-05-01', endDate: '2026-05-18', parent: 1400, kind: 'task', percentComplete: 44},
		{id: 1420, text: 'Performance and Security Testing', startDate: '2026-05-20', endDate: '2026-06-02', parent: 1400, kind: 'task', percentComplete: 25},
		{id: 1430, text: 'User Acceptance Testing', startDate: '2026-06-08', endDate: '2026-06-23', parent: 1400, kind: 'task', percentComplete: 10},
		{id: 1500, text: 'Release Readiness', startDate: '2026-06-28', parent: 1000, kind: 'milestone', data: {owner: 'bob', priority: 'medium'}},
		{id: 1510, text: 'Production Cutover', startDate: '2026-06-29', endDate: '2026-07-02', parent: 1000, kind: 'task', percentComplete: 0},
		{id: 1520, text: 'Hypercare Window', startDate: '2026-07-03', endDate: '2026-07-09', parent: 1000, kind: 'task', percentComplete: 0},
	],
	links: [
		{id: 1, source: 1110, target: 1120, type: 'FS', data: {label: 'interviews feed backlog'}},
		{id: 2, source: 1120, target: 1130, type: 'FS', data: {label: 'backlog informs blueprint'}},
		{id: 3, source: 1130, target: 1140, type: 'FS'},
		{id: 4, source: 1140, target: 1210, type: 'FS'},
		{id: 5, source: 1140, target: 1220, type: 'FS'},
		{id: 6, source: 1210, target: 1230, type: 'SS'},
		{id: 7, source: 1210, target: 1310, type: 'FS'},
		{id: 8, source: 1220, target: 1320, type: 'FS'},
		{id: 9, source: 1230, target: 1330, type: 'FS'},
		{id: 10, source: 1310, target: 1341, type: 'FS'},
		{id: 11, source: 1341, target: 1342, type: 'FS'},
		{id: 12, source: 1320, target: 1410, type: 'FS'},
		{id: 13, source: 1330, target: 1410, type: 'FS'},
		{id: 14, source: 1342, target: 1410, type: 'FS'},
		{id: 15, source: 1410, target: 1420, type: 'FS'},
		{id: 16, source: 1420, target: 1430, type: 'FS'},
		{id: 17, source: 1430, target: 1500, type: 'FS'},
		{id: 18, source: 1500, target: 1510, type: 'FS'},
		{id: 19, source: 1510, target: 1520, type: 'FS'},
		{id: 20, source: 1220, target: 1430, type: 'FF'},
		{id: 21, source: 1310, target: 1320, type: 'SS'},
	],
} as const satisfies GanttInputRaw<DemoTaskData, DemoLinkData>;
