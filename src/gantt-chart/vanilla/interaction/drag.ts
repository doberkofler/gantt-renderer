import {type TaskNode} from '../../domain/tree.ts';
import {type PixelMapper} from '../../timeline/pixelMapper.ts';
import {parseDate, addDays} from '../../domain/dateMath.ts';
import {type Task} from '../../validation/schemas.ts';
import {type GanttCallbacks} from '../gantt-chart.ts';

/**
 * Attaches drag-to-move and resize listeners to a bar element.
 * Returns a cleanup function that removes all listeners.
 *
 * Design: all mutable state lives in closure variables captured at mousedown.
 * No global state; multiple bars can be dragged independently (one at a time).
 */
export function attachDrag(barEl: HTMLElement, resizeHandleEl: HTMLElement, task: TaskNode, getMapper: () => PixelMapper, cbs: GanttCallbacks): () => void {
	// ── Move ───────────────────────────────────────────────────────────────
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
		cbs.onSelect?.(task.id);

		const startX = e.clientX;
		const originDate = parseDate(task.start_date);
		const mapper = getMapper(); // snapshot at mousedown

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			const days = Math.round(mapper.widthToDuration(dx));
			cbs.onMove?.({id: task.id, startDate: addDays(originDate, days)});
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			barEl.style.cursor = 'grab';
		}

		barEl.style.cursor = 'grabbing';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	// ── Resize ─────────────────────────────────────────────────────────────
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
		const origDur = task.duration;
		const mapper = getMapper();

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			const daysDelta = Math.round(mapper.widthToDuration(dx));
			cbs.onResize?.({id: task.id, duration: Math.max(1, origDur + daysDelta)});
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function onBarClick(event: MouseEvent): void {
		if (event.detail !== 2) {
			return;
		}
		cbs.onTaskEditIntent?.({id: task.id, source: 'bar', trigger: 'double_click', task: toTask(task)});
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
 * Returns cleanup.
 */
export function attachMilestoneClick(diamondEl: HTMLElement, taskId: number, cbs: GanttCallbacks): () => void {
	function onClick(): void {
		cbs.onSelect?.(taskId);
	}
	function onDoubleClick(event: MouseEvent): void {
		if (event.detail === 2) {
			const task = (diamondEl as HTMLElement & {__task?: Task}).__task;
			if (task === undefined) {
				return;
			}
			cbs.onTaskEditIntent?.({id: taskId, source: 'milestone', trigger: 'double_click', task});
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

function toTask(row: TaskNode): Task {
	return {
		id: row.id,
		text: row.text,
		start_date: row.start_date,
		duration: row.duration,
		progress: row.progress,
		type: row.type,
		open: row.open,
		...(row.parent === undefined ? {} : {parent: row.parent}),
		...(row.color === undefined ? {} : {color: row.color}),
	};
}
