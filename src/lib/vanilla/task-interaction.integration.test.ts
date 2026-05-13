import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';
import {type GanttInput} from '../validation/schemas.ts';

const READONLY_INPUT: GanttInput = {
	tasks: [
		{id: 1, text: 'Readonly Task', startDate: '2026-02-01', endDate: '2026-02-04', percentComplete: 40, kind: 'task', readonly: true},
		{id: 2, text: 'Writable Task', startDate: '2026-02-04', endDate: '2026-02-07', percentComplete: 30, kind: 'task'},
		{id: 3, text: 'Readonly Milestone', startDate: '2026-02-08', kind: 'milestone', readonly: true},
	],
	links: [],
};

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

		expect(onTaskDoubleClickMock).toHaveBeenCalledTimes(3);
		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 3})}));
		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));
		expect(onTaskDoubleClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 5})}));
	});

	it('emits onTaskMove and onTaskResize through drag interactions only on pointerup', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskMoveMock = vi.fn<(payload: {task: {id: number}; newStartDate: Date}) => boolean>();
		const onTaskResizeMock = vi.fn<(payload: {task: {id: number}; newStartDate: Date; newEndDate: Date}) => boolean>();
		const onTaskMove = (payload: {task: {id: number}; newStartDate: Date}): boolean => {
			onTaskMoveMock(payload);
			return true;
		};
		const onTaskResize = (payload: {task: {id: number}; newStartDate: Date; newEndDate: Date}): boolean => {
			onTaskResizeMock(payload);
			return true;
		};

		mountTracked(container, INPUT, {}, {onTaskMove, onTaskResize});

		const bars = container.querySelectorAll('.gantt-bar');
		const [, bar] = bars;
		expect(bar).toBeDefined();
		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 200, pointerId: 1}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 1}));

		expect(onTaskMoveMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 2})}));

		const handle = bar?.querySelector('.gantt-resize-handle');
		expect(handle).not.toBeNull();
		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 140, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 240, pointerId: 2}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 2}));

		expect(onTaskResizeMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 2}), newEndDate: expect.any(Date)}));
		{
			const [firstResizeCall] = onTaskResizeMock.mock.calls;
			expect(firstResizeCall?.[0]?.newEndDate).toBeInstanceOf(Date);
		}
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

		expect(onProgressChangeMock).toHaveBeenCalledWith(
			expect.objectContaining({task: expect.objectContaining({id: 1}), newPercentComplete: expect.any(Number)}),
		);
		{
			const [firstCall] = onProgressChangeMock.mock.calls;
			expect(firstCall?.[0]?.newPercentComplete).toBeGreaterThanOrEqual(0);
			expect(firstCall?.[0]?.newPercentComplete).toBeLessThanOrEqual(100);
		}
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
		const onTaskClick = (payload: {task: {id: number; percentComplete?: number}}): void => {
			selectCalls.push(payload.task.percentComplete ?? -1);
		};

		const instance = mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange, onTaskClick});

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

	it('reverts percentComplete when onProgressChange returns Promise<false>', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		let calledWithPercent = -1;
		const onProgressChange = async (payload: {newPercentComplete: number}): Promise<boolean> => {
			calledWithPercent = payload.newPercentComplete;
			await Promise.resolve();
			return false;
		};

		const instance = mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 5}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 150, pointerId: 5}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 5}));

		expect(calledWithPercent).toBeGreaterThan(40);

		instance.select(1);
		await vi.waitFor(() => {
			expect(calledWithPercent).toBeGreaterThan(40);
		});
	});

	it('reverts task move when onTaskMove returns Promise<false>', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskMove = async (): Promise<boolean> => {
			await Promise.resolve();
			return false;
		};

		mountTracked(container, INPUT, {height: 420}, {onTaskMove});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();

		const originalStart = bar?.style.left;

		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 200, pointerId: 6}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 260, pointerId: 6}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 6}));

		await vi.waitFor(() => {
			const movedBar = container.querySelector<HTMLElement>('.gantt-bar');
			expect(movedBar?.style.left).toBe(originalStart);
		});
	});

	it('reverts task resize when onTaskResize returns Promise<false>', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskResize = async (): Promise<boolean> => {
			await Promise.resolve();
			return false;
		};

		mountTracked(container, INPUT, {height: 420}, {onTaskResize});

		const resizeHandle = container.querySelector<HTMLElement>('.gantt-resize-handle');
		expect(resizeHandle).not.toBeNull();

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		const originalWidth = bar?.style.width;

		resizeHandle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 300, pointerId: 7}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 350, pointerId: 7}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 7}));

		await vi.waitFor(() => {
			const resizedBar = container.querySelector<HTMLElement>('.gantt-bar');
			expect(resizedBar?.style.width).toBe(originalWidth);
		});
	});

	it('accepts task move when onTaskMove returns Promise<true>', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		let called = false;
		const onTaskMove = async (): Promise<boolean> => {
			await Promise.resolve();
			called = true;
			return true;
		};

		mountTracked(container, INPUT, {height: 420}, {onTaskMove});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 200, pointerId: 8}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 260, pointerId: 8}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 8}));

		await vi.waitFor(() => {
			expect(called).toBe(true);
		});
	});

	it('accepts progress change when onProgressChange returns Promise<true>', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		let called = false;
		const onProgressChange = async (): Promise<boolean> => {
			await Promise.resolve();
			called = true;
			return true;
		};

		mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 9}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 180, pointerId: 9}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 9}));

		await vi.waitFor(() => {
			expect(called).toBe(true);
		});
	});

	it('readonly task bar has no resize handle', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, READONLY_INPUT);

		const readonlyBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="1"]');
		expect(readonlyBar).not.toBeNull();
		expect(readonlyBar?.querySelector('.gantt-resize-handle')).toBeNull();
	});

	it('readonly task bar has pointer cursor not grab', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, READONLY_INPUT);

		const readonlyBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="1"]');
		expect(readonlyBar?.style.cursor).toBe('pointer');

		const writableBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="2"]');
		expect(writableBar?.style.cursor).toBe('grab');
	});

	it('readonly milestone has default cursor', () => {
		const container = document.createElement('div');
		document.body.append(container);
		mountTracked(container, READONLY_INPUT);

		const milestone = container.querySelector<HTMLElement>('.gantt-milestone[data-task-id="3"]');
		expect(milestone?.style.cursor).toBe('default');
	});

	it('readonly task does not fire onTaskMove on drag', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskMoveMock = vi.fn<(payload: {task: {id: number}}) => boolean>();
		const onTaskMove = (payload: {task: {id: number}}): boolean => {
			onTaskMoveMock(payload);
			return true;
		};

		mountTracked(container, READONLY_INPUT, {}, {onTaskMove});

		const readonlyBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="1"]');
		expect(readonlyBar).not.toBeNull();

		readonlyBar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 10}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 150, pointerId: 10}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 10}));

		expect(onTaskMoveMock).not.toHaveBeenCalled();
	});

	it('readonly task can still be selected', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskClickMock = vi.fn<(payload: {task: {id: number}}) => void>();
		const onTaskClick = (payload: {task: {id: number}}): void => {
			onTaskClickMock(payload);
		};

		mountTracked(container, READONLY_INPUT, {}, {onTaskClick});

		const readonlyBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="1"]');
		readonlyBar?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(onTaskClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));
	});

	it('reverts task move when onTaskMove returns false synchronously', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskMove = (): boolean => false;

		mountTracked(container, INPUT, {height: 420}, {onTaskMove});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		const originalStart = bar?.style.left;

		bar?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 200, pointerId: 20}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 260, pointerId: 20}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 20}));

		const movedBar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(movedBar?.style.left).toBe(originalStart);
	});

	it('reverts task resize when onTaskResize returns false synchronously', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskResize = (): boolean => false;

		mountTracked(container, INPUT, {height: 420}, {onTaskResize});

		const resizeHandle = container.querySelector<HTMLElement>('.gantt-resize-handle');
		expect(resizeHandle).not.toBeNull();

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		const originalWidth = bar?.style.width;

		resizeHandle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 300, pointerId: 21}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 350, pointerId: 21}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 21}));

		const resizedBar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(resizedBar?.style.width).toBe(originalWidth);
	});

	it('reverts progress when onProgressChange returns false synchronously', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onProgressChange = (): boolean => false;

		const instance = mountTracked(container, INPUT, {progressDragEnabled: true}, {onProgressChange});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		const progressOverlay = bar?.querySelector<HTMLElement>('.gantt-progress-overlay');
		expect(progressOverlay).not.toBeNull();

		progressOverlay?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 22}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 180, pointerId: 22}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 22}));

		expect(() => {
			instance.select(1);
		}).not.toThrow();
	});

	it('fires onLinkClick when dependency link is clicked', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onLinkClickMock = vi.fn<(payload: {link: {id: number}}) => void>();
		const onLinkClick = (payload: {link: {id: number}}): void => {
			onLinkClickMock(payload);
		};

		mountTracked(container, INPUT, {height: 420}, {onLinkClick});

		const linkPath = container.querySelector<SVGPathElement>('path[data-link-id]');
		expect(linkPath).not.toBeNull();
		linkPath?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 1}));

		expect(onLinkClickMock).toHaveBeenCalledWith(expect.objectContaining({link: expect.objectContaining({id: 1})}));
	});

	it('fires onLinkDblClick when dependency link is double-clicked', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onLinkDblClickMock = vi.fn<(payload: {link: {id: number}}) => void>();
		const onLinkDblClick = (payload: {link: {id: number}}): void => {
			onLinkDblClickMock(payload);
		};

		mountTracked(container, INPUT, {height: 420}, {onLinkDblClick});

		const linkPath = container.querySelector<SVGPathElement>('path[data-link-id]');
		expect(linkPath).not.toBeNull();
		linkPath?.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		expect(onLinkDblClickMock).toHaveBeenCalledWith(expect.objectContaining({link: expect.objectContaining({id: 1})}));
	});

	it('fires onTaskAdd when add button is clicked', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskAddMock = vi.fn<(payload: {parentTask: {id: number}}) => boolean>();
		const onTaskAdd = (payload: {parentTask: {id: number}}): boolean => {
			onTaskAddMock(payload);
			return true;
		};

		mountTracked(container, INPUT, {}, {onTaskAdd});

		const addBtn = container.querySelector<HTMLElement>('.gantt-add-btn');
		expect(addBtn).not.toBeNull();
		addBtn?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(onTaskAddMock).toHaveBeenCalledWith(expect.objectContaining({parentTask: expect.objectContaining({id: 1})}));
	});

	it('handles keyboard Enter on bar for selection', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskClickMock = vi.fn<(payload: {task: {id: number}}) => void>();
		const onTaskClick = (payload: {task: {id: number}}): void => {
			onTaskClickMock(payload);
		};

		mountTracked(container, INPUT, {}, {onTaskClick});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		bar?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		expect(onTaskClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));
	});

	it('handles keyboard Enter on milestone for selection', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskClickMock = vi.fn<(payload: {task: {id: number}}) => void>();
		const onTaskClick = (payload: {task: {id: number}}): void => {
			onTaskClickMock(payload);
		};

		mountTracked(container, INPUT, {}, {onTaskClick});

		const milestone = container.querySelector<HTMLElement>('.gantt-milestone');
		expect(milestone).not.toBeNull();
		milestone?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		expect(onTaskClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 5})}));
	});

	it('handles keyboard Enter on grid row for selection', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTaskClickMock = vi.fn<(payload: {task: {id: number}}) => void>();
		const onTaskClick = (payload: {task: {id: number}}): void => {
			onTaskClickMock(payload);
		};

		mountTracked(container, INPUT, {}, {onTaskClick});

		const row = container.querySelector<HTMLElement>('[role="row"]');
		expect(row).not.toBeNull();
		row?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		expect(onTaskClickMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));
	});

	it('shows and hides link creation handles on bar hover', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {linkCreationEnabled: true});

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));

		expect(container.querySelectorAll('.gantt-link-endpoint').length).toBeGreaterThanOrEqual(2);
		expect(bar?.closest('.gantt-root')).not.toBeNull();
	});

	it('shows and hides link creation handle on milestone hover', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {linkCreationEnabled: true});

		const milestone = container.querySelector<HTMLElement>('.gantt-milestone');
		expect(milestone).not.toBeNull();

		milestone?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));

		expect(container.querySelectorAll('.gantt-link-endpoint').length).toBeGreaterThan(0);
	});
});
