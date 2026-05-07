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
		--gantt-container-border-radius: 6px;
		--gantt-container-border: 1px solid var(--gantt-border);
		--gantt-container-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}
	.gantt-root {
		border: var(--gantt-container-border);
		border-radius: var(--gantt-container-border-radius);
		box-shadow: var(--gantt-container-shadow);
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

describe('container framing (M12)', () => {
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

	it('defines container framing CSS custom properties on :root', () => {
		const styles = getComputedStyle(document.documentElement);

		expect(styles.getPropertyValue('--gantt-container-border-radius')).toBe('6px');
		// getComputedStyle resolves var() references, so --gantt-border (#e9ecef) is expanded
		expect(styles.getPropertyValue('--gantt-container-border')).toBe('1px solid #e9ecef');
		expect(styles.getPropertyValue('--gantt-container-shadow')).toBe('0 1px 3px rgba(0, 0, 0, 0.08)');
	});

	it('root element has gantt-root class and gets border from CSS', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root).not.toBeNull();
		expect(root?.classList.contains('gantt-root')).toBe(true);
	});

	it('root element does not have inline border or borderRadius style', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root).not.toBeNull();

		// Container framing is now CSS-only, not inline
		expect(root?.style.border).toBe('');
		expect(root?.style.borderRadius).toBe('');
	});

	it('root element keeps overflow hidden for border-radius clipping', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root).not.toBeNull();
		expect(root?.style.overflow).toBe('hidden');
	});

	it('left pane has borderRight for pane separation', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		// Internal pane divider (not container framing) should still be present
		expect(leftPane?.style.borderRight).toBe('1px solid var(--gantt-border)');
	});

	it('right pane does not have its own container border', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, INPUT);

		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(rightPane).not.toBeNull();

		// Right pane should not have extraneous borders that conflict with container framing
		expect(rightPane?.style.border).toBe('');
		expect(rightPane?.style.borderTop).toBe('');
		expect(rightPane?.style.borderBottom).toBe('');
		expect(rightPane?.style.borderRight).toBe('');
		expect(rightPane?.style.borderLeft).toBe('');
	});
});
