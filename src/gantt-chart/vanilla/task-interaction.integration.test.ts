import {describe, expect, it, vi} from 'vitest';
import {type GanttInput} from '../validation/schemas.ts';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('task interaction', () => {
	const {mountTracked} = createMountHelpers();

	it('fires onTaskEditIntent from grid, bar, and milestone', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskEditIntentMock =
			vi.fn<(payload: {id: number; source: 'grid' | 'bar' | 'milestone'; trigger: 'double_click'; task: GanttInput['tasks'][number]}) => void>();
		const onTaskEditIntent = (payload: {
			id: number;
			source: 'grid' | 'bar' | 'milestone';
			trigger: 'double_click';
			task: GanttInput['tasks'][number];
		}): void => {
			onTaskEditIntentMock(payload);
		};

		mountTracked(container, INPUT, {onTaskEditIntent});

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

		expect(onTaskEditIntentMock).toHaveBeenCalledWith(expect.objectContaining({id: 3, source: 'grid', trigger: 'double_click'}));
		expect(onTaskEditIntentMock).toHaveBeenCalledWith(expect.objectContaining({id: 1, source: 'bar', trigger: 'double_click'}));
		expect(onTaskEditIntentMock).toHaveBeenCalledWith(expect.objectContaining({id: 5, source: 'milestone', trigger: 'double_click'}));
	});

	it('emits onMove and onResize through drag interactions', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onMoveMock = vi.fn<(payload: {id: number; startDate: Date}) => void>();
		const onResizeMock = vi.fn<(payload: {id: number; duration: number}) => void>();
		const onMove = (payload: {id: number; startDate: Date}): void => {
			onMoveMock(payload);
		};
		const onResize = (payload: {id: number; duration: number}): void => {
			onResizeMock(payload);
		};

		mountTracked(container, INPUT, {onMove, onResize});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();
		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 180, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onMoveMock).toHaveBeenCalled();
		const [firstMoveCall] = onMoveMock.mock.calls;
		expect(firstMoveCall).toBeDefined();
		if (firstMoveCall === undefined) {
			throw new Error('Expected first move callback call');
		}
		expect(firstMoveCall[0]).toMatchObject({id: 1});

		const handle = container.querySelector('.gantt-resize-handle');
		expect(handle).not.toBeNull();
		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 140, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 200, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 2}));

		expect(onResizeMock).toHaveBeenCalled();
		const [firstResizeCall] = onResizeMock.mock.calls;
		expect(firstResizeCall).toBeDefined();
		if (firstResizeCall === undefined) {
			throw new Error('Expected first resize callback call');
		}
		expect(firstResizeCall[0]).toMatchObject({id: 1});
		expect(firstResizeCall[0].duration).toBeGreaterThanOrEqual(1);
	});
});
