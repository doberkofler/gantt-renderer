import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {attachLinkEndpointHandle, createEndpointHandle} from './linkCreation.ts';
import {hideGhostLine, createDependencyLayer} from '../dom/dependencyLayer.ts';

function makeLayer(): [SVGSVGElement, HTMLElement] {
	const absoluteLayer = document.createElement('div');
	Object.defineProperty(absoluteLayer, 'getBoundingClientRect', {
		configurable: true,
		value: () => ({left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600}),
	});
	document.body.append(absoluteLayer);

	const svgLayer = createDependencyLayer(1000, 600);
	absoluteLayer.append(svgLayer);

	return [svgLayer, absoluteLayer];
}

describe('createEndpointHandle', () => {
	it('creates a handle with the correct class and default style', () => {
		const handle = createEndpointHandle();
		expect(handle.className).toBe('gantt-link-endpoint');
		expect(handle.style.position).toBe('absolute');
		expect(handle.style.width).toBe('10px');
		expect(handle.style.height).toBe('10px');
		expect(handle.style.borderRadius).toBe('50%');
		expect(handle.style.cursor).toBe('crosshair');
		expect(handle.style.opacity).toBe('0');
		expect(handle.getAttribute('tabindex')).toBeNull(); // set by caller
	});
});

describe('attachLinkEndpointHandle', () => {
	let svgLayer: SVGSVGElement;
	let absoluteLayer: HTMLElement;

	beforeEach(() => {
		document.body.innerHTML = '';
		[svgLayer, absoluteLayer] = makeLayer();
	});

	afterEach(() => {
		hideGhostLine(svgLayer);
	});

	function mockCbs(onLinkCreate: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void): {
		onLinkCreate?: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void;
	} {
		return {onLinkCreate} as {onLinkCreate?: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void};
	}

	it('fires onLinkCreate when drag ends on a valid target bar', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const targetBar = document.createElement('div');
		targetBar.dataset['taskId'] = '2';
		targetBar.style.cssText = 'position:absolute;left:200px;top:40px;width:100px;height:28px;';
		absoluteLayer.append(targetBar);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).toHaveBeenCalledWith({sourceTaskId: 1, targetTaskId: 2, type: 'FS'});
	});

	it('does not fire onLinkCreate when drag ends on the source task itself', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const sourceBar = document.createElement('div');
		sourceBar.dataset['taskId'] = '1';
		sourceBar.style.cssText = 'position:absolute;left:0px;top:40px;width:100px;height:28px;';
		absoluteLayer.append(sourceBar);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 30, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('does not fire onLinkCreate when drag ends on empty space', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 800, clientY: 400, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('does not fire onLinkCreate when drag ends on a non-bar element', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const plainDiv = document.createElement('div');
		plainDiv.style.cssText = 'position:absolute;left:200px;top:40px;width:100px;height:28px;';
		absoluteLayer.append(plainDiv);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('cleans up listeners on returned cleanup', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const targetBar = document.createElement('div');
		targetBar.dataset['taskId'] = '2';
		absoluteLayer.append(targetBar);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		const cleanup = attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);
		cleanup();

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('sets accessibility attributes on the handle', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const cbs = mockCbs(vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>());
		attachLinkEndpointHandle(handle, 42, 50, 54, svgLayer, absoluteLayer, cbs);

		expect(handle.getAttribute('tabindex')).toBe('0');
		expect(handle.getAttribute('role')).toBe('button');
		expect(handle.getAttribute('aria-label')).toBe('Create link from task 42');
	});

	it('shows ghost line during drag and hides on up', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const targetBar = document.createElement('div');
		targetBar.dataset['taskId'] = '2';
		targetBar.style.cssText = 'position:absolute;left:200px;top:40px;width:100px;height:28px;';
		absoluteLayer.append(targetBar);

		const cbs = mockCbs(vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>());
		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));

		const ghost = svgLayer.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost?.style.display).toBe('');
		expect(ghost?.hasAttribute('stroke-dasharray')).toBe(false);
		expect(ghost?.getAttribute('marker-end')).toBe('url(#gantt-arrow)');

		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(ghost?.style.display).toBe('none');
		expect(ghost?.hasAttribute('marker-end')).toBe(false);
	});

	it('shows dashed ghost line when not over a bar', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const cbs = mockCbs(vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>());
		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 800, clientY: 400, pointerId: 1}));

		const ghost = svgLayer.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost?.getAttribute('stroke-dasharray')).toBe('5 3');
		expect(ghost?.hasAttribute('marker-end')).toBe(false);

		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));
	});

	it('ignores non-primary mouse button', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const onLinkCreateMock = vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>();
		const cbs = mockCbs(onLinkCreateMock);

		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 2, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onLinkCreateMock).not.toHaveBeenCalled();
	});

	it('handles onLinkCreate being undefined gracefully', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const targetBar = document.createElement('div');
		targetBar.dataset['taskId'] = '2';
		targetBar.style.cssText = 'position:absolute;left:200px;top:40px;width:100px;height:28px;';
		absoluteLayer.append(targetBar);

		const cbs = {};
		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		handle.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 50, clientY: 54, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 250, clientY: 54, pointerId: 1}));
		expect(() => {
			window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));
		}).not.toThrow();
	});

	it('handles keyboard Enter and Space on handle', () => {
		const handle = document.createElement('div');
		absoluteLayer.append(handle);

		const cbs = mockCbs(vi.fn<(payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void>());
		attachLinkEndpointHandle(handle, 1, 50, 54, svgLayer, absoluteLayer, cbs);

		expect(() => {
			handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
			handle.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}));
			handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		}).not.toThrow();
	});
});
