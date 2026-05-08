import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('splitter handle (M13)', () => {
	const {mountTracked} = createMountHelpers();

	it('renders a splitter handle with col-resize cursor', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, leftPaneWidth: 340});

		const splitter = container.querySelector<HTMLElement>('.gantt-splitter-handle');
		expect(splitter).not.toBeNull();
		expect(splitter?.style.cursor).toBe('col-resize');
	});

	it('fires onLeftPaneWidthChange on splitter drag-end', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 1024});
		document.body.append(container);
		const onSplitterMock = vi.fn<(width: number) => void>();

		mountTracked(container, INPUT, {height: 420}, {onLeftPaneWidthChange: onSplitterMock});

		const splitter = container.querySelector<HTMLElement>('.gantt-splitter-handle');
		expect(splitter).not.toBeNull();

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();

		const startWidth = Number.parseFloat(leftPane?.style.width ?? '0') || 0;

		splitter?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: startWidth, pointerId: 50}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: startWidth + 40, pointerId: 50}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 50}));

		expect(onSplitterMock).toHaveBeenCalled();
		const newWidth = onSplitterMock.mock.calls[0]?.[0];
		expect(newWidth).toBeGreaterThan(startWidth);
	});

	it('enforces minimum left pane width of 96px', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 1024});
		document.body.append(container);
		const onSplitterMock = vi.fn<(width: number) => void>();

		mountTracked(container, INPUT, {height: 420}, {onLeftPaneWidthChange: onSplitterMock});

		const splitter = container.querySelector<HTMLElement>('.gantt-splitter-handle');
		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');

		const startWidth = Number.parseFloat(leftPane?.style.width ?? '0') || 0;

		// Try to drag far left
		splitter?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: startWidth, pointerId: 51}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: -500, pointerId: 51}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 51}));

		expect(onSplitterMock).toHaveBeenCalled();
		expect(onSplitterMock.mock.calls[0]?.[0]).toBe(96);
	});

	it('enforces right pane minimum width via max left pane', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 400});
		document.body.append(container);
		const onSplitterMock = vi.fn<(width: number) => void>();

		// timelineMinWidth defaults to 220, so max left = 400 - 220 = 180
		mountTracked(container, INPUT, {height: 420}, {onLeftPaneWidthChange: onSplitterMock});

		const splitter = container.querySelector<HTMLElement>('.gantt-splitter-handle');
		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');

		const startWidth = Number.parseFloat(leftPane?.style.width ?? '0') || 0;

		// Try to drag far right
		splitter?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: startWidth, pointerId: 52}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 1000, pointerId: 52}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 52}));

		expect(onSplitterMock).toHaveBeenCalled();
		// 400 - 220 = 180 max left pane
		expect(onSplitterMock.mock.calls[0]?.[0]).toBeLessThanOrEqual(180);
	});
});
