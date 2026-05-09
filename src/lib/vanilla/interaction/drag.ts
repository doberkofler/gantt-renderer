import {type TaskNode} from '../../domain/tree.ts';
import {type PixelMapper} from '../../timeline/pixelMapper.ts';
import {parseDate, addHours} from '../../domain/dateMath.ts';
import {type Task} from '../../validation/schemas.ts';

type InternalCallbacks = {
	onTaskClick?: (id: number) => void;
	onTaskMove?: (payload: {id: number; startDate: Date}) => void;
	onTaskResize?: (payload: {id: number; durationHours: number}) => void;
	onTaskDoubleClick?: (payload: {id: number; task: Task}) => void;
	_onTaskMoveFinal?: (payload: {id: number; startDate: Date}) => Promise<boolean>;
	_onTaskResizeFinal?: (payload: {id: number; durationHours: number}) => Promise<boolean>;
	onTaskProgressDrag?: (payload: {id: number; percentComplete: number}) => void;
	_onTaskProgressDragFinal?: (payload: {id: number; percentComplete: number}) => Promise<boolean>;
};

function toTask(node: TaskNode): Task {
	const base = {
		id: node.id,
		text: node.text,
		startDate: node.startDate,
		...(node.parent === undefined ? {} : {parent: node.parent}),
		...(node.color === undefined ? {} : {color: node.color}),
		...(node.data === undefined ? {} : {data: node.data}),
	};

	switch (node.kind) {
		case 'task': {
			return {
				...base,
				kind: 'task',
				durationHours: node.durationHours,
				percentComplete: node.percentComplete,
			};
		}
		case 'project': {
			return {
				...base,
				kind: 'project',
				durationHours: node.durationHours,
				percentComplete: node.percentComplete,
				open: node.open,
			};
		}
		case 'milestone': {
			return {...base, kind: 'milestone'};
		}
	}
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
		cbs.onTaskClick?.(task.id);

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
			void cbs._onTaskMoveFinal?.({id: task.id, startDate: addHours(originDate, lastHours)});
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
		const origDur = task.kind !== 'milestone' ? task.durationHours : 0;
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
			void cbs._onTaskResizeFinal?.({id: task.id, durationHours: lastDuration});
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
 * Attaches drag-to-change-progress listeners to a progress overlay element.
 *
 * @param progressEl - The progress overlay DOM element.
 * @param barEl - The bar DOM element (for width measurement).
 * @param task - The {@link TaskNode} for this bar.
 * @param _getMapper - A function returning the current {@link PixelMapper} (unused, kept for API symmetry).
 * @param cbs - The chart callbacks.
 * @returns A cleanup function that removes all listeners.
 */
export function attachProgressDrag(
	progressEl: HTMLElement,
	barEl: HTMLElement,
	task: TaskNode,
	_getMapper: () => PixelMapper,
	cbs: InternalCallbacks,
): () => void {
	function onProgressDown(e: PointerEvent): void {
		if (e.button !== 0) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		cbs.onTaskClick?.(task.id);
		try {
			progressEl.setPointerCapture(e.pointerId);
		} catch {
			// Browsers/tests may reject synthetic pointer ids.
		}

		const startX = e.clientX;
		const barWidth = barEl.getBoundingClientRect().width;
		const origPercent = task.kind !== 'milestone' ? (task.percentComplete ?? 0) : 0;

		let lastPercent = origPercent;

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			const percentDelta = barWidth > 0 ? (dx / barWidth) * 100 : 0;
			lastPercent = Math.max(0, Math.min(100, Math.round(origPercent + percentDelta)));
			cbs.onTaskProgressDrag?.({id: task.id, percentComplete: lastPercent});
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			progressEl.style.cursor = 'ew-resize';
			void cbs._onTaskProgressDragFinal?.({id: task.id, percentComplete: lastPercent});
		}

		progressEl.style.cursor = 'ew-resize';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	progressEl.addEventListener('pointerdown', onProgressDown);

	return () => {
		progressEl.removeEventListener('pointerdown', onProgressDown);
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
		cbs.onTaskClick?.(taskId);
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
