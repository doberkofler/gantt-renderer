import {describe, expect, it} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('core rendering and viewport', () => {
	const {mountTracked} = createMountHelpers();

	it('renders gantt structure', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
		expect(container.querySelectorAll('.gantt-bar').length).toBeGreaterThan(0);
		expect(container.querySelectorAll('.gantt-milestone')).toHaveLength(1);
	});

	it('keeps timeline visible at 375px viewport with responsive split pane', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 375,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420});

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(leftPane).not.toBeNull();
		expect(rightPane).not.toBeNull();
		expect(Number.parseInt(leftPane?.style.width ?? '0', 10)).toBeLessThan(340);
		expect(rightPane?.style.minWidth).toBe('220px');
	});

	it('applies desktop proportional left pane width at 1920px viewport', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 1920,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420});

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(leftPane).not.toBeNull();
		expect(rightPane).not.toBeNull();

		const width = Number.parseInt(leftPane?.style.width ?? '0', 10);
		// desktop min ratio: 1920 * 0.25 = 480
		expect(width).toBe(480);
	});

	it('applies desktop proportional left pane width at 1024px viewport', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 1024,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420});

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		const width = Number.parseInt(leftPane?.style.width ?? '0', 10);
		expect(width).toBe(306);
	});

	it('uses explicit leftPaneWidth option over computed value', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 1200,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, leftPaneWidth: 400});

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();
		expect(leftPane?.style.width).toBe('400px');
	});

	it('custom grid schema increases natural width and pane width proportionally', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 1200,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {
			height: 420,
			gridColumns: [
				{id: 'name', header: 'Task name', width: '1fr'},
				{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
				{id: 'duration', header: 'Days', width: '68px', field: 'duration'},
				{id: 'progress', header: '%', width: '60px', field: 'progress'},
				{id: 'actions', header: '', width: '28px'},
			],
		});

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();
		const width = Number.parseInt(leftPane?.style.width ?? '0', 10);
		// default columns natural width is 306, custom cols is 366, ratio at 1200 => more
		expect(width).toBeGreaterThan(300);
	});

	it('respects timelineMinWidth at very narrow viewports', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {
			configurable: true,
			value: 300,
		});
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, timelineMinWidth: 180});

		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(rightPane).not.toBeNull();
		expect(rightPane?.style.minWidth).toBe('180px');
	});
});
