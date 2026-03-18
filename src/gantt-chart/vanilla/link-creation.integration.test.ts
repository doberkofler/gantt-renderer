import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('C4 — link-creation endpoint controls', () => {
	const {mountTracked} = createMountHelpers();

	it('does not render endpoint handles when linkCreationEnabled is false (default)', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420});

		const handles = container.querySelectorAll('.gantt-link-endpoint');
		expect(handles).toHaveLength(0);
	});

	it('renders endpoint handles on bars when linkCreationEnabled is true', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, linkCreationEnabled: true});

		const handles = container.querySelectorAll('.gantt-link-endpoint');
		expect(handles.length).toBeGreaterThan(0);
	});

	it('renders two endpoint handles per task bar and one per milestone', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, linkCreationEnabled: true});

		const handles = container.querySelectorAll('.gantt-link-endpoint');
		// 4 task bars x 2 handles + 1 milestone x 1 handle = 9
		expect(handles).toHaveLength(9);
	});

	it('does not render endpoint handles on bars when linkCreationEnabled is false', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, linkCreationEnabled: false});

		const handles = container.querySelectorAll('.gantt-link-endpoint');
		expect(handles).toHaveLength(0);
	});

	it('fires onLinkCreate when endpoint drag ends on a different task bar', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();

		mountTracked(container, INPUT, {
			height: 420,
			linkCreationEnabled: true,
			onLinkCreate: onLinkCreateMock,
		});

		const handles = container.querySelectorAll<HTMLElement>('.gantt-link-endpoint');
		expect(handles.length).toBeGreaterThanOrEqual(2);

		// Use second handle (first bar's right endpoint)
		const [, handle] = handles;
		expect(handle).toBeDefined();
		if (handle === undefined) {
			return;
		}

		// Find the target bar (task 3)
		const targetBar = container.querySelector<HTMLElement>('[data-task-id="3"]');
		expect(targetBar).not.toBeNull();
		if (targetBar === null) {
			return;
		}

		const handleRect = handle.getBoundingClientRect();
		const targetRect = targetBar.getBoundingClientRect();

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: handleRect.left, clientY: handleRect.top, pointerId: 10}));
		window.dispatchEvent(
			new PointerEvent('pointermove', {
				bubbles: true,
				clientX: targetRect.left + targetRect.width / 2,
				clientY: targetRect.top + targetRect.height / 2,
				pointerId: 10,
			}),
		);
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 10}));

		expect(onLinkCreateMock).toHaveBeenCalled();
		const call = onLinkCreateMock.mock.calls[0]?.[0];
		expect(call?.type).toBe('FS');
		expect(call?.sourceTaskId).toBeGreaterThan(0);
		expect(call?.targetTaskId).toBeGreaterThan(0);
		expect(call?.sourceTaskId).not.toBe(call?.targetTaskId);
	});

	it('does not fire onLinkCreate when endpoint drag ends on same task', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();

		mountTracked(container, INPUT, {
			height: 420,
			linkCreationEnabled: true,
			onLinkCreate: onLinkCreateMock,
		});

		const handle = container.querySelector<HTMLElement>('.gantt-link-endpoint');
		expect(handle).not.toBeNull();
		if (handle === null) {
			return;
		}

		const bar = container.querySelector<HTMLElement>('[data-task-id="1"]');
		expect(bar).not.toBeNull();
		if (bar === null) {
			return;
		}

		const handleRect = handle.getBoundingClientRect();
		const barRect = bar.getBoundingClientRect();

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: handleRect.left, clientY: handleRect.top, pointerId: 11}));
		window.dispatchEvent(
			new PointerEvent('pointermove', {bubbles: true, clientX: barRect.left + barRect.width / 2, clientY: barRect.top + barRect.height / 2, pointerId: 11}),
		);
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 11}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('hides ghost line after drag complete or cancel', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {
			height: 420,
			linkCreationEnabled: true,
		});

		const handle = container.querySelector<HTMLElement>('.gantt-link-endpoint');
		expect(handle).not.toBeNull();
		if (handle === null) {
			return;
		}

		const handleRect = handle.getBoundingClientRect();

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: handleRect.left, clientY: handleRect.top, pointerId: 12}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 500, clientY: 300, pointerId: 12}));

		const ghost = container.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost).not.toBeNull();

		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 12}));

		expect(ghost?.style.display).toBe('none');
	});

	it('endpoint handles have correct accessibility attributes', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {height: 420, linkCreationEnabled: true});

		const handle = container.querySelector<HTMLElement>('.gantt-link-endpoint');
		expect(handle?.getAttribute('tabindex')).toBe('0');
		expect(handle?.getAttribute('role')).toBe('button');
		expect(handle?.getAttribute('aria-label')).toMatch(/Create link from task \d+/);
	});
});
