import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
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

describe('typography scale tokens', () => {
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

	it('defines all typography CSS custom properties on :root', () => {
		const styles = getComputedStyle(document.documentElement);

		expect(styles.getPropertyValue('--gantt-font-size-xs')).toBe('11px');
		expect(styles.getPropertyValue('--gantt-font-size-sm')).toBe('12px');
		expect(styles.getPropertyValue('--gantt-font-size-md')).toBe('13px');
		expect(styles.getPropertyValue('--gantt-font-size-lg')).toBe('16px');
		expect(styles.getPropertyValue('--gantt-font-weight-normal')).toBe('400');
		expect(styles.getPropertyValue('--gantt-font-weight-semibold')).toBe('600');
		expect(styles.getPropertyValue('--gantt-font-weight-bold')).toBe('700');
		expect(styles.getPropertyValue('--gantt-letter-spacing-tight')).toBe('0.04em');
		expect(styles.getPropertyValue('--gantt-letter-spacing-wide')).toBe('0.05em');
	});

	it('left pane header labels use typography token references', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		const leftHeader = leftPane?.children[0] as HTMLElement | undefined;
		expect(leftHeader).not.toBeNull();

		const headerGrid = leftHeader?.children[0] as HTMLElement | undefined;
		const headerSpans = [...(headerGrid?.querySelectorAll('span') ?? [])];

		expect(headerSpans.length).toBe(4);
		for (const el of headerSpans) {
			const span = el as HTMLElement;
			if (span.textContent === '') {
				continue;
			}
			expect(span.style.fontSize).toBe('var(--gantt-font-size-xs)');
			expect(span.style.fontWeight).toBe('var(--gantt-font-weight-bold)');
			expect(span.style.letterSpacing).toBe('var(--gantt-letter-spacing-wide)');
		}
	});

	it('left pane row name labels use typography token references with correct weight by type', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		const leftBody = leftPane?.children[1] as HTMLElement | undefined;
		const rows = leftBody?.querySelectorAll<HTMLElement>('[data-task-id]') ?? [];
		expect(rows.length).toBeGreaterThanOrEqual(2);

		const fontWeights: Record<string, string> = {};
		for (const row of rows) {
			const nameCell = (row.children[0] ?? null) as HTMLElement | null;
			expect(nameCell).not.toBeNull();
			const childrenArr = [...(nameCell?.children ?? [])];
			const label = (childrenArr.at(-1) ?? null) as HTMLElement | null;
			expect(label).not.toBeNull();
			expect(label?.style.fontSize).toBe('var(--gantt-font-size-md)');

			const text = label?.textContent ?? '';
			fontWeights[text] = label?.style.fontWeight ?? '';
		}

		expect(fontWeights['Project Alpha']).toBe('var(--gantt-font-weight-bold)');
		expect(fontWeights['Task Beta']).toBe('var(--gantt-font-weight-normal)');
	});

	it('left pane start-date and duration cells use token references', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		const leftBody = leftPane?.children[1] as HTMLElement | undefined;
		const rows = leftBody?.querySelectorAll<HTMLElement>('[data-task-id]') ?? [];
		expect(rows.length).toBeGreaterThanOrEqual(1);

		for (const row of rows) {
			const spanCells = [...row.children].filter((c) => c.tagName === 'SPAN');
			expect(spanCells.length).toBeGreaterThan(0);
			for (const cell of spanCells) {
				const el = cell as HTMLElement;
				expect(el.style.fontSize).toBe('var(--gantt-font-size-sm)');
			}
		}
	});

	it('time header upper and lower rows use typography token references', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(rightPane).not.toBeNull();

		const rightHeader = rightPane?.children[0] as HTMLElement | undefined;
		for (const row of [...(rightHeader?.children ?? [])]) {
			for (const child of [...row.children]) {
				const cell = child as HTMLElement;
				expect(cell.style.fontSize).toBe('var(--gantt-font-size-xs)');
			}
		}
	});

	it('bar labels use typography token references', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const labels = container.querySelectorAll<HTMLElement>('.gantt-bar span');
		expect(labels.length).toBeGreaterThan(0);

		for (const label of labels) {
			expect(label.style.fontSize).toBe('var(--gantt-font-size-sm)');
			expect(label.style.fontWeight).toBe('var(--gantt-font-weight-semibold)');
			expect(label.style.color).toBe('var(--gantt-bar-label-color)');
			expect(label.style.overflow).toBe('hidden');
			expect(label.style.textOverflow).toBe('ellipsis');
		}
	});

	it('bar label placement is consistent across bar sizes', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const labels = container.querySelectorAll<HTMLElement>('.gantt-bar span');
		expect(labels.length).toBeGreaterThan(0);

		for (const label of labels) {
			expect(label.style.position).toBe('absolute');
			expect(label.style.left).toBe('8px');
			expect(label.style.right).toBe('8px');
			expect(label.style.top).toBe('50%');
			expect(label.style.transform).toBe('translateY(-50%)');
			expect(label.style.whiteSpace).toBe('nowrap');
			expect(label.style.pointerEvents).toBe('none');
		}
	});

	it('bar label contrast is preserved in selected and non-selected states', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const instance = mountTracked(container, INPUT);

		const barEls = container.querySelectorAll<HTMLElement>('.gantt-bar');
		expect(barEls.length).toBeGreaterThan(1);

		const firstBar = barEls.item(0);
		expect(firstBar).not.toBeNull();
		if (!firstBar) {
			return;
		}

		const label = firstBar.querySelector<HTMLElement>('span');
		expect(label).not.toBeNull();
		expect(label?.style.color).toBe('var(--gantt-bar-label-color)');
		expect(label?.style.textShadow).not.toBe('');

		const taskId = Number(firstBar.dataset['taskId']);
		expect(Number.isFinite(taskId)).toBe(true);

		instance.select(taskId);

		await vi.waitFor(() => {
			const selectedBar = container.querySelector<HTMLElement>(`.gantt-bar[data-task-id="${taskId}"]`);
			expect(selectedBar).not.toBeNull();
			expect(selectedBar?.classList.contains('gantt-bar--selected')).toBe(true);

			const selectedLabel = selectedBar?.querySelector<HTMLElement>('span');
			expect(selectedLabel).not.toBeNull();
			expect(selectedLabel?.style.color).toBe('var(--gantt-bar-label-color)');
			expect(selectedLabel?.style.textShadow).not.toBe('');
		});
	});

	it('milestone labels use typography token references', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const labels = container.querySelectorAll<HTMLElement>('.gantt-milestone span');
		expect(labels.length).toBeGreaterThan(0);

		for (const label of labels) {
			expect(label.style.fontSize).toBe('var(--gantt-font-size-xs)');
			expect(label.style.fontWeight).toBe('var(--gantt-font-weight-semibold)');
		}
	});
});
