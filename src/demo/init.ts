import {GanttChart, parseGanttInput, type GanttCallbacks, type GanttInstance, type GanttOptions, type ThemeMode, type TimeScale} from 'gantt-renderer';
import {RAW_INPUT} from './data.ts';
import '../styles/gantt.css';

const initialInput = parseGanttInput(RAW_INPUT);
const DEMO_SPECIAL_DAYS = [
	{date: '2026-01-01', kind: 'holiday' as const, label: "New Year's Day"},
	{date: '2026-02-14', kind: 'custom' as const, label: 'Architecture Freeze'},
	{date: '2026-03-17', kind: 'custom' as const, label: 'Integration Cutoff'},
	{date: '2026-05-01', kind: 'holiday' as const, label: "International Workers' Day"},
	{date: '2026-05-25', kind: 'holiday' as const, label: 'Memorial Day'},
	{date: '2026-07-04', kind: 'holiday' as const, label: 'Independence Day'},
];
const SUPPORTED_SCALES: Record<string, TimeScale> = {
	hour: 'hour',
	day: 'day',
	week: 'week',
	month: 'month',
	quarter: 'quarter',
	year: 'year',
};

const ZOOM_LEVELS: TimeScale[] = ['year', 'quarter', 'month', 'week', 'day', 'hour'];

type DemoControlState = {
	currentScale: TimeScale;
	currentLocale: string;
	isFullscreen: boolean;
	zoomLevel: number;
	currentOptions: {
		linkCreationEnabled: boolean;
		highlightLinkedDependenciesOnSelect: boolean;
		showWeekends: boolean;
		responsiveSplitPane: boolean;
	};
};

function appendEventLog(message: string): void {
	const logEl = document.querySelector<HTMLTextAreaElement>('#event-log');
	if (logEl === null) {
		return;
	}
	const timestamp = new Date().toISOString().slice(11, 19);
	logEl.value = `${logEl.value}${logEl.value.length > 0 ? '\n' : ''}[${timestamp}] ${message}`;
	logEl.scrollTop = logEl.scrollHeight;
}

function logControlHook(controlId: string, action: string, selectedValue?: string): void {
	appendEventLog(`${controlId} | ${action}${selectedValue === undefined ? '' : ` | value=${selectedValue}`}`);
	console.info('[demo-shell-control]', {
		controlId,
		action,
		selectedValue: selectedValue ?? null,
		timestamp: new Date().toISOString(),
	});
}

function showControlFeedback(message: string): void {
	appendEventLog(message);
}

function clearControlFeedback(): void {
	// no-op: feedback is written to the event log
}

/**
 * Bootstraps the demo:
 *   - mounts the Gantt into #gantt
 *   - wires demo-shell control row actions
 *   - appends status updates to #event-log
 */
export const init = (): void => {
	const container = document.querySelector<HTMLElement>('#gantt');
	if (container === null) {
		throw new Error('Missing #gantt element');
	}
	const ganttEl = container;

	const state: DemoControlState = {
		currentScale: 'day',
		currentLocale: 'en-US',
		isFullscreen: false,
		zoomLevel: ZOOM_LEVELS.indexOf('day'),
		currentOptions: {
			linkCreationEnabled: false,
			highlightLinkedDependenciesOnSelect: false,
			showWeekends: true,
			responsiveSplitPane: true,
		},
	};

	const callbacks: GanttCallbacks = {
		onTaskSelect(payload): void {
			const {task} = payload;
			appendEventLog(
				[
					`selected ${task.text}`,
					`id=${task.id}`,
					`start=${task.startDate}`,
					`durationHours=${task.kind !== 'milestone' ? task.durationHours : 0}h`,
					`kind=${task.kind}`,
					`percentComplete=${task.kind !== 'milestone' ? task.percentComplete : 0}%`,
				].join(' | '),
			);
		},
		onTaskMove(payload): boolean {
			logControlHook('task-move', 'integrated', payload.task.id.toString());
			console.info('move', payload.task.id, payload.newStartDate.toISOString().slice(0, 10));
			return true;
		},
		onTaskResize(payload): boolean {
			logControlHook('task-resize', 'integrated', payload.task.id.toString());
			console.info('resize', payload.task.id, payload.newDurationHours);
			return true;
		},
		onTaskDoubleClick(payload): void {
			const {task} = payload;
			appendEventLog(
				[`edit intent ${task.text}`, `id=${task.id}`, `start=${task.startDate}`, `durationHours=${task.kind !== 'milestone' ? task.durationHours : 0}h`].join(
					' | ',
				),
			);
		},
		onLeftPaneWidthChange(width): void {
			logControlHook('pane-splitter', 'integrated', `${width}px`);
		},
		onGridColumnsChange(columns): void {
			const widths = columns.filter((c) => c.visible !== false).map((c) => `${c.id}:${c.width}`);
			logControlHook('grid-columns-resize', 'integrated', widths.join(', '));
		},
	};

	function buildOptions(): GanttOptions {
		return {
			scale: state.currentScale,
			theme: 'system',
			locale: state.currentLocale,
			height: 580,
			leftPaneWidth: 340,
			specialDays: DEMO_SPECIAL_DAYS,
			linkCreationEnabled: state.currentOptions.linkCreationEnabled,
			highlightLinkedDependenciesOnSelect: state.currentOptions.highlightLinkedDependenciesOnSelect,
			showWeekends: state.currentOptions.showWeekends,
			responsiveSplitPane: state.currentOptions.responsiveSplitPane,
		};
	}

	let instance: GanttInstance = new GanttChart(ganttEl, buildOptions(), callbacks);
	instance.update(initialInput);
	appendEventLog('demo initialized');

	function remountChart(): void {
		instance.destroy();
		instance = new GanttChart(ganttEl, buildOptions(), callbacks);
		instance.update(initialInput);
	}

	const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select');
	themeSelect?.addEventListener('change', () => {
		const requested = themeSelect.value as ThemeMode;
		document.documentElement.dataset['theme'] = requested;
		logControlHook('theme-select', 'integrated', requested);
	});

	const setScaleSelect = document.querySelector<HTMLSelectElement>('#scale-select');
	setScaleSelect?.addEventListener('change', () => {
		const requested = setScaleSelect.value;
		const supported = SUPPORTED_SCALES[requested];
		if (supported === undefined) {
			logControlHook('scale-select', 'placeholder', requested);
			showControlFeedback(`Not implemented yet: ${requested[0]?.toUpperCase()}${requested.slice(1)}s`);
			setScaleSelect.value = state.currentScale;
			return;
		}
		clearControlFeedback();
		state.currentScale = supported;
		state.zoomLevel = ZOOM_LEVELS.indexOf(supported);
		instance.setOptions({scale: supported});
		logControlHook('scale-select', 'integrated', supported);
	});

	const localeSelect = document.querySelector<HTMLSelectElement>('#locale-select');
	localeSelect?.addEventListener('change', () => {
		const requested = localeSelect.value;
		state.currentLocale = requested;
		remountChart();
		logControlHook('locale-select', 'integrated', requested);
	});

	document.querySelector<HTMLElement>('#control-collapse-all')?.addEventListener('click', () => {
		instance.collapseAll();
		clearControlFeedback();
		logControlHook('control-collapse-all', 'integrated');
	});

	document.querySelector<HTMLElement>('#control-expand-all')?.addEventListener('click', () => {
		instance.expandAll();
		clearControlFeedback();
		logControlHook('control-expand-all', 'integrated');
	});

	document.querySelector<HTMLInputElement>('#toggle-link-creation')?.addEventListener('change', (e) => {
		const {checked} = e.target as HTMLInputElement;
		state.currentOptions.linkCreationEnabled = checked;
		remountChart();
		logControlHook('toggle-link-creation', 'toggled', checked ? 'on' : 'off');
	});

	document.querySelector<HTMLInputElement>('#toggle-highlight-deps')?.addEventListener('change', (e) => {
		const {checked} = e.target as HTMLInputElement;
		state.currentOptions.highlightLinkedDependenciesOnSelect = checked;
		remountChart();
		logControlHook('toggle-highlight-deps', 'toggled', checked ? 'on' : 'off');
	});

	document.querySelector<HTMLInputElement>('#toggle-show-weekends')?.addEventListener('change', (e) => {
		const {checked} = e.target as HTMLInputElement;
		state.currentOptions.showWeekends = checked;
		remountChart();
		logControlHook('toggle-show-weekends', 'toggled', checked ? 'on' : 'off');
	});

	document.querySelector<HTMLInputElement>('#toggle-responsive')?.addEventListener('change', (e) => {
		const {checked} = e.target as HTMLInputElement;
		state.currentOptions.responsiveSplitPane = checked;
		remountChart();
		logControlHook('toggle-responsive', 'toggled', checked ? 'on' : 'off');
	});

	const shell = document.querySelector<HTMLElement>('#demo-shell');
	const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen-btn');
	const toggleFullscreen = (): void => {
		if (shell === null || fullscreenButton === null) {
			return;
		}
		if (document.fullscreenElement !== shell) {
			// oxlint-disable-next-line typescript-eslint/no-floating-promises
			shell.requestFullscreen();
			logControlHook('fullscreen', 'integrated', 'enter');
			return;
		}
		// oxlint-disable-next-line typescript-eslint/no-floating-promises
		document.exitFullscreen();
		logControlHook('fullscreen', 'integrated', 'exit');
	};
	if (fullscreenButton !== null) {
		fullscreenButton.addEventListener('click', (): void => {
			toggleFullscreen();
		});
	}

	document.addEventListener('fullscreenchange', () => {
		state.isFullscreen = document.fullscreenElement === shell;
		if (fullscreenButton !== null) {
			fullscreenButton.setAttribute('aria-pressed', state.isFullscreen ? 'true' : 'false');
			fullscreenButton.textContent = state.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
		}
		logControlHook('fullscreen-change', 'integrated', state.isFullscreen ? 'active' : 'inactive');
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && document.fullscreenElement === shell) {
			logControlHook('fullscreen', 'integrated', 'escape');
		}
	});
};
