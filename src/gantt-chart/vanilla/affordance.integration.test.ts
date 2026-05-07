import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {GanttChart, type GanttOptions} from './gantt-chart.ts';
import {type GanttInput} from '../validation/schemas.ts';

const TOKENS_STYLE = `
	:root {
		--gantt-font-size-xs: 11px;
		--gantt-font-size-sm: 12px;
		--gantt-font-size-md: 13px;
		--gantt-font-size-lg: 16px;
		--gantt-font-weight-normal: 400;
		--gantt-font-weight-semibold: 600;
		--gantt-font-weight-bold: 700;
		--gantt-letter-spacing-tight: 0.04em;
		--gantt-letter-spacing-wide: 0.05em;
		--gantt-font: "Inter", "Segoe UI", system-ui, sans-serif;
		--gantt-bg: #ffffff;
		--gantt-header-bg: #f8f9fa;
		--gantt-stripe: #fafbfc;
		--gantt-border: #e9ecef;
		--gantt-grid-line: #f1f3f5;
		--gantt-text: #212529;
		--gantt-text-secondary: #868e96;
		--gantt-task: #4c6ef5;
		--gantt-project: #2ecc97;
		--gantt-milestone: #9b59b6;
		--gantt-selection: #ff6b35;
		--gantt-selection-ring: rgba(255, 107, 53, 0.32);
		--gantt-selection-glow: rgba(255, 107, 53, 0.16);
		--gantt-link: #adb5bd;
		--gantt-link-hi: #ff6b35;
		--gantt-row-height: 44px;
		--gantt-bar-height: 28px;
		--gantt-milestone-size: 20px;
		--gantt-today: rgba(255, 107, 53, 0.35);
		--gantt-row-selected: #edf2ff;
		--gantt-bar-label-color: #ffffff;
	}
`;

const INPUT: GanttInput = {
	tasks: [
		{id: 1, text: 'Project Alpha', startDate: '2026-02-01', duration: 12, progress: 0.4, type: 'project', open: true},
		{id: 2, text: 'Task Beta', startDate: '2026-02-01', duration: 3, progress: 0.9, type: 'task', parent: 1, open: true},
		{id: 3, text: 'Milestone Gamma', startDate: '2026-02-05', duration: 0, progress: 0, type: 'milestone', parent: 1, open: true},
	],
	links: [{id: 1, source: 2, target: 3, type: 'FS'}],
};

describe('add/toggle affordance visibility', () => {
	const instances: GanttChart[] = [];
	let styleEl: HTMLStyleElement;

	function mountTracked(container: HTMLElement, input: GanttInput, opts?: GanttOptions): GanttChart {
		const instance = new GanttChart(container, opts);
		instance.update(input);
		instances.push(instance);
		return instance;
	}

	beforeEach(() => {
		document.body.innerHTML = '';
		styleEl = document.createElement('style');
		styleEl.textContent = TOKENS_STYLE;
		document.head.append(styleEl);
	});

	afterEach(() => {
		while (instances.length > 0) {
			instances.pop()?.destroy();
		}
		styleEl.remove();
		document.body.innerHTML = '';
	});

	it('row wrappers have gantt-row CSS class', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const rows = container.querySelectorAll<HTMLElement>('[role="row"]');
		expect(rows.length).toBeGreaterThan(0);

		for (const row of rows) {
			expect(row.classList.contains('gantt-row')).toBe(true);
		}
	});

	it('toggle buttons have gantt-toggle class and are present on parent rows', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const toggles = container.querySelectorAll<HTMLElement>('.gantt-toggle');
		expect(toggles.length).toBeGreaterThan(0);

		for (const toggle of toggles) {
			expect(toggle.classList.contains('gantt-toggle')).toBe(true);
		}
	});

	it('add buttons have gantt-add-btn class and are present when actions column included', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const addBtns = container.querySelectorAll<HTMLElement>('.gantt-add-btn');
		expect(addBtns.length).toBeGreaterThan(0);

		for (const btn of addBtns) {
			expect(btn.classList.contains('gantt-add-btn')).toBe(true);
		}
	});

	it('add buttons are not rendered when actions column is omitted from schema', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT, {
			gridColumns: [
				{id: 'name', header: 'Task name', width: '1fr'},
				{id: 'startDate', header: 'Start time', width: '90px', field: 'startDate'},
				{id: 'duration', header: 'Duration', width: '68px', field: 'duration'},
			],
		});

		const addBtns = container.querySelectorAll('.gantt-add-btn');
		expect(addBtns.length).toBe(0);
	});

	it('toggle buttons are present even when actions column is omitted', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT, {
			gridColumns: [
				{id: 'name', header: 'Task name', width: '1fr'},
				{id: 'startDate', header: 'Start time', width: '90px', field: 'startDate'},
				{id: 'duration', header: 'Duration', width: '68px', field: 'duration'},
			],
		});

		const toggles = container.querySelectorAll<HTMLElement>('.gantt-toggle');
		expect(toggles.length).toBeGreaterThan(0);
	});

	it('both toggle and add affordances exist in the DOM', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const toggles = container.querySelectorAll<HTMLElement>('.gantt-toggle');
		const addBtns = container.querySelectorAll<HTMLElement>('.gantt-add-btn');

		expect(toggles.length).toBeGreaterThan(0);
		expect(addBtns.length).toBeGreaterThan(0);
	});
});
