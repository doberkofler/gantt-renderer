import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('task interaction', () => {
	const {mountTracked} = createMountHelpers();

	it('fires onTaskDoubleClick from grid, bar, and milestone', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskDoubleClickMock = vi.fn<(payload: {task: {id: number}}) => void>();
		const onTaskDoubleClick = (payload: {task: {id: number}}): void => {
			onTaskDoubleClickMock(payload);
		};

		mountTracked(container, INPUT, {}, {onTaskDoubleClick});

		const rowLabel = [...container.querySelectorAll('span')].find((el) => el.textContent === 'API Implementation');
		expect(rowLabel).toBeDefined();
		const row = rowLabel?.closest('[role="row"]');
		expect(row).not.toBeNull();
		row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		const bar = container.querySelector<HTMLElement>('.gantt-bar[aria-label="Task Customer Portal Release"]');
		expect(bar).not.toBeNull();
		bar?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 2}));

		const milestone = container.querySelector<HTMLElement>('.gantt-milestone[aria-label="Milestone UAT Exit Milestone"]');
		expect(milestone).not.toBeNull();
		milestone?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 2}));

		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 3})}));
		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));
		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 5})}));
	});

	it('emits onTaskMove and onTaskResize through drag interactions only on pointerup', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskMoveMock = vi.fn<(payload: {task: {id: number}; newStartDate: Date}) => boolean>();
		const onTaskResizeMock = vi.fn<(payload: {task: {id: number}; newDurationHours: number}) => boolean>();
		const onTaskMove = (payload: {task: {id: number}; newStartDate: Date}): boolean => {
			onTaskMoveMock(payload);
			return true;
		};
		const onTaskResize = (payload: {task: {id: number}; newDurationHours: number}): boolean => {
			onTaskResizeMock(payload);
			return true;
		};

		mountTracked(container, INPUT, {}, {onTaskMove, onTaskResize});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();
		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 120, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onTaskMoveMock).toHaveBeenCalled();
		const [firstMoveCall] = onTaskMoveMock.mock.calls;
		expect(firstMoveCall).toBeDefined();
		if (firstMoveCall === undefined) {
			throw new Error('Expected first move callback call');
		}
		expect(firstMoveCall[0]).toMatchObject({task: expect.objectContaining({id: 1})});

		const handle = container.querySelector('.gantt-resize-handle');
		expect(handle).not.toBeNull();
		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 140, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 160, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 2}));

		expect(onTaskResizeMock).toHaveBeenCalled();
		const [firstResizeCall] = onTaskResizeMock.mock.calls;
		expect(firstResizeCall).toBeDefined();
		if (firstResizeCall === undefined) {
			throw new Error('Expected first resize callback call');
		}
		expect(firstResizeCall[0]).toMatchObject({task: expect.objectContaining({id: 1})});
		expect(firstResizeCall[0].newDurationHours).toBeGreaterThanOrEqual(1);
	});

	it('emits onProgressChange on progress overlay drag', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onProgressChangeMock = vi.fn<(payload: {task: {id: number}; newPercentComplete: number}) => boolean>();
		const onProgressChange = (payload: {task: {id: number}; newPercentComplete: number}): boolean => {
			onProgressChangeMock(payload);
			return true;
		};

		mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange});

		const bar = container.querySelector<HTMLElement>('.gantt-bar[aria-label="Task Customer Portal Release"]');
		expect(bar).not.toBeNull();
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 3}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 130, pointerId: 3}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 3}));

		expect(onProgressChangeMock).toHaveBeenCalled();
		const [firstCall] = onProgressChangeMock.mock.calls;
		expect(firstCall).toBeDefined();
		if (firstCall === undefined) {
			throw new Error('Expected first progress change callback call');
		}
		expect(firstCall[0]).toMatchObject({task: expect.objectContaining({id: 1})});
		expect(firstCall[0].newPercentComplete).toBeGreaterThanOrEqual(0);
		expect(firstCall[0].newPercentComplete).toBeLessThanOrEqual(100);
	});

	it('does not emit onProgressChange on right-click of progress overlay', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onProgressChangeMock = vi.fn<(payload: {task: {id: number}; newPercentComplete: number}) => boolean>();
		const onProgressChange = (payload: {task: {id: number}; newPercentComplete: number}): boolean => {
			onProgressChangeMock(payload);
			return true;
		};

		mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange});

		const bar = container.querySelector<HTMLElement>('.gantt-bar[aria-label="Task Customer Portal Release"]');
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 2, clientX: 100, pointerId: 4}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 130, pointerId: 4}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 4}));

		expect(onProgressChangeMock).not.toHaveBeenCalled();
	});

	it('reverts percentComplete when onProgressChange returns false', () => {
		const container = document.createElement('div');
		document.body.append(container);
		let calledWithPercent = -1;
		const selectCalls: number[] = [];
		const onProgressChange = (payload: {newPercentComplete: number}): boolean => {
			calledWithPercent = payload.newPercentComplete;
			return false;
		};
		const onTaskSelect = (payload: {task: {id: number; percentComplete?: number}}): void => {
			selectCalls.push(payload.task.percentComplete ?? -1);
		};

		const instance = mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange, onTaskSelect});

		const bar = container.querySelector<HTMLElement>('.gantt-bar[aria-label="Task Customer Portal Release"]');
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 5}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 180, pointerId: 5}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 5}));

		expect(calledWithPercent).toBeGreaterThan(40);
		expect(selectCalls.length).toBeGreaterThanOrEqual(1);
		expect(selectCalls[0]).toBe(40);
		instance.select(1);
		expect(selectCalls.at(-1)).toBe(40);
	});
});
