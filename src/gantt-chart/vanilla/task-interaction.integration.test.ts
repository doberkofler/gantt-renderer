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

		mountTracked(container, INPUT, {onTaskDoubleClick});

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

		mountTracked(container, INPUT, {onTaskMove, onTaskResize});

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
});
