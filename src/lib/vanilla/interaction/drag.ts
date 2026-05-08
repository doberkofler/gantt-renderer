import {type TaskNode} from '../../domain/tree.ts';
import {type PixelMapper} from '../../timeline/pixelMapper.ts';
import {parseDate, addHours} from '../../domain/dateMath.ts';
import {type Task} from '../../validation/schemas.ts';

type InternalCallbacks = {
	onTaskSelect?: (id: number) => void;
	onTaskMove?: (payload: {id: number; startDate: Date}) => void;
	onTaskResize?: (payload: {id: number; durationHours: number}) => void;
	onTaskDoubleClick?: (payload: {id: number; task: Task}) => void;
	_onTaskMoveFinal?: (payload: {id: number; startDate: Date}) => boolean;
	_onTaskResizeFinal?: (payload: {id: number; durationHours: number}) => boolean;
};

function toTask(row: TaskNode): Task {
	return {
		id: row.id,
		text: row.text,
		startDate: row.startDate,
		durationHours: row.durationHours,
		percentComplete: row.percentComplete,
		type: row.type,
		open: row.open,
		...(row.parent === undefined ? {} : {parent: row.parent}),
		...(row.color === undefined ? {} : {color: row.color}),
	};
}

/**
 * Attaches drag-to-move and resize listeners to a bar element.
 *
 * Design: all mutable state lives in closure variables captured at mousedown.
 * No global state; multiple bars can be dragged independently (one at a time).
 *
 * @param barEl - The bar DOM element.
 * @param resizeHandleEl - The resize handle DOM element.
 * @param task - The {@link TaskNode} for this bar.
 * @param getMapper - A function returning the current {@link PixelMapper} (snapshotted at mousedown).
 * @param cbs - The chart callbacks.
 * @returns A cleanup function that removes all listeners.
 */
export function attachDrag(barEl: HTMLElement, resizeHandleEl: HTMLElement, task: TaskNode, getMapper: () => PixelMapper, cbs: InternalCallbacks): () => void {
	function onBarDown(e: PointerEvent): void {
		if (e.button !== 0) {
			return;
		}
		e.preventDefault();
		try {
			barEl.setPointerCapture(e.pointerId);
		} catch {
			// Browsers/tests may reject synthetic pointer ids.
		}
		cbs.onTaskSelect?.(task.id);

		const startX = e.clientX;
		const originDate = parseDate(task.startDate);
		const mapper = getMapper();

		let lastHours = 0;

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			lastHours = Math.round(mapper.widthToDuration(dx));
			cbs.onTaskMove?.({id: task.id, startDate: addHours(originDate, lastHours)});
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			barEl.style.cursor = 'grab';
			cbs._onTaskMoveFinal?.({id: task.id, startDate: addHours(originDate, lastHours)});
		}

		barEl.style.cursor = 'grabbing';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function onResizeDown(e: PointerEvent): void {
		if (e.button !== 0) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		try {
			resizeHandleEl.setPointerCapture(e.pointerId);
		} catch {
			// Browsers/tests may reject synthetic pointer ids.
		}

		const startX = e.clientX;
		const origDur = task.durationHours;
		const mapper = getMapper();

		let lastDuration = origDur;

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			const hoursDelta = Math.round(mapper.widthToDuration(dx));
			lastDuration = Math.max(1, origDur + hoursDelta);
			cbs.onTaskResize?.({id: task.id, durationHours: lastDuration});
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			cbs._onTaskResizeFinal?.({id: task.id, durationHours: lastDuration});
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function onBarClick(event: MouseEvent): void {
		if (event.detail !== 2) {
			return;
		}
		cbs.onTaskDoubleClick?.({id: task.id, task: toTask(task)});
	}

	barEl.addEventListener('pointerdown', onBarDown);
	barEl.addEventListener('click', onBarClick);
	resizeHandleEl.addEventListener('pointerdown', onResizeDown);

	return () => {
		barEl.removeEventListener('pointerdown', onBarDown);
		barEl.removeEventListener('click', onBarClick);
		resizeHandleEl.removeEventListener('pointerdown', onResizeDown);
	};
}

/**
 * Attaches click-to-select on a milestone diamond.
 *
 * @param diamondEl - The milestone diamond DOM element.
 * @param taskId - The task ID to select.
 * @param cbs - The chart callbacks.
 * @returns A cleanup function that removes all listeners.
 */
export function attachMilestoneClick(diamondEl: HTMLElement, taskId: number, cbs: InternalCallbacks): () => void {
	function onClick(): void {
		cbs.onTaskSelect?.(taskId);
	}
	function onDoubleClick(event: MouseEvent): void {
		if (event.detail === 2) {
			const task = (diamondEl as HTMLElement & {__task?: Task}).__task;
			if (task === undefined) {
				return;
			}
			cbs.onTaskDoubleClick?.({id: taskId, task});
		}
	}
	diamondEl.addEventListener('click', onClick);
	diamondEl.addEventListener('click', onDoubleClick);
	return () => {
		diamondEl.removeEventListener('click', onClick);
		diamondEl.removeEventListener('click', onDoubleClick);
	};
}

export function bindMilestoneTask(diamondEl: HTMLElement, task: Task): void {
	(diamondEl as HTMLElement & {__task?: Task}).__task = task;
}
