import {vi} from 'vitest';
import {type GanttState} from '../state.ts';
import {type LeftPaneCallbacks} from './leftPane.ts';
import {type TaskNode} from '../../domain/tree.ts';
import {CHART_LOCALE_EN_US} from '../../locale.ts';

export function mockState(overrides: Partial<GanttState> = {}): GanttState {
	return {
		input: {tasks: [], links: []},
		scale: 'day',
		highlightLinkedDependenciesOnSelect: false,
		expandedIds: new Set(),
		selectedId: null,
		scrollTop: 0,
		allRows: [],
		mapper: {} as GanttState['mapper'],
		viewportStart: new Date('2026-01-01T00:00:00.000Z'),
		viewportEnd: new Date('2026-02-01T00:00:00.000Z'),
		totalWidth: 500,
		layouts: new Map(),
		links: [],
		startIndex: 0,
		endIndex: 0,
		paddingTop: 0,
		paddingBottom: 0,
		showWeekends: true,
		weekendDays: new Set([0, 6]),
		specialDaysByDate: new Map(),
		locale: CHART_LOCALE_EN_US,
		...overrides,
	} as GanttState;
}

export function mockCallbacks(overrides: Partial<LeftPaneCallbacks> = {}): LeftPaneCallbacks {
	return {
		onToggle: vi.fn<(id: number) => void>(),
		onTaskSelect: vi.fn<(id: number) => void>(),
		onRowClick: vi.fn<(payload: {id: number; task: {id: number} & Record<string, unknown>}) => void>(),
		onTaskDoubleClick: vi.fn<(payload: {id: number; task: {id: number} & Record<string, unknown>}) => void>(),
		onTaskAdd: vi.fn<(id: number) => void>(),
		...overrides,
	};
}

export function taskNode(overrides: Partial<TaskNode> = {}): TaskNode {
	return {
		id: 1,
		text: 'Task Name',
		startDate: '2026-01-15',
		durationHours: 120,
		percentComplete: 30,
		type: 'task',
		open: true,
		children: [],
		depth: 0,
		...overrides,
	};
}

export function projectNode(overrides: Partial<TaskNode> & {children?: TaskNode[]} = {}): TaskNode {
	const children = overrides.children ?? [];
	return {
		id: 1,
		text: 'Project',
		startDate: '2026-01-01',
		durationHours: 480,
		percentComplete: 50,
		type: 'project',
		open: true,
		children,
		depth: 0,
		...overrides,
	};
}
