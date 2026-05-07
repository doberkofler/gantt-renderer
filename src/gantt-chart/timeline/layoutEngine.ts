import {type TaskNode} from '../domain/tree.ts';
import {type PixelMapper} from './pixelMapper.ts';
import {parseDate, addHours} from '../domain/dateMath.ts';

export const DENSITY = {
	rowHeight: 44,
	barHeight: 28,
	milestoneSize: 20,
} as const;

export const ROW_HEIGHT = DENSITY.rowHeight;
export const BAR_HEIGHT = DENSITY.barHeight;
export const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
export const MILESTONE_SIZE = DENSITY.milestoneSize;
/** Half-width of a milestone diamond */
export const MILESTONE_HALF = MILESTONE_SIZE / 2;

export type BarLayout = {
	taskId: number;
	/** Left edge x in timeline coordinates */
	x: number;
	/** Top edge y in content coordinates */
	y: number;
	width: number;
	height: number;
	progressWidth: number;
	type: 'task' | 'project' | 'milestone';
	rowIndex: number;
	/** Center x; identical to x + width/2 or x for milestones */
	centerX: number;
	centerY: number;
};

/**
 * Computes pixel-space layout for all visible task rows.
 * Returns a map keyed by task id for O(1) lookup during link routing.
 *
 * @param rows - The flattened, visible {@link TaskNode} rows.
 * @param mapper - The {@link PixelMapper} for coordinate conversion.
 * @returns A `Map` from task ID to its computed {@link BarLayout}.
 */
export function computeLayout(rows: TaskNode[], mapper: PixelMapper): Map<number, BarLayout> {
	const result = new Map<number, BarLayout>();

	for (let i = 0; i < rows.length; i++) {
		const task = rows[i];
		if (task === undefined) {
			continue;
		}

		const start = parseDate(task.startDate);
		const x = mapper.toX(start);
		const y = i * ROW_HEIGHT + BAR_Y_OFFSET;
		const centerY = i * ROW_HEIGHT + ROW_HEIGHT / 2;

		const type = task.type ?? 'task';

		if (type === 'milestone') {
			result.set(task.id, {
				taskId: task.id,
				x,
				y,
				width: 0,
				height: BAR_HEIGHT,
				progressWidth: 0,
				type: 'milestone',
				rowIndex: i,
				centerX: x,
				centerY,
			});
			continue;
		}

		const width = Math.max(mapper.durationToWidth(task.durationHours), 4);
		const progressWidth = width * Math.min(1, Math.max(0, task.progress ?? 0));

		result.set(task.id, {
			taskId: task.id,
			x,
			y,
			width,
			height: BAR_HEIGHT,
			progressWidth,
			type,
			rowIndex: i,
			centerX: x + width / 2,
			centerY,
		});
	}

	return result;
}

/**
 * Computes the total pixel height of all rows.
 *
 * @param rowCount - The number of visible rows.
 * @returns The total pixel height (`rowCount * ROW_HEIGHT`).
 */
export function totalContentHeight(rowCount: number): number {
	return rowCount * ROW_HEIGHT;
}

/**
 * Derives viewport bounds from task data with padding.
 *
 * @param tasks - The task nodes to derive bounds from.
 * @param paddingHours - Extra hours added before the earliest start and after the latest end. Defaults to `48`.
 * @returns A tuple `[start, end]` of UTC midnight `Date` instances.
 */
export function deriveViewport(tasks: TaskNode[], paddingHours = 48): [Date, Date] {
	if (tasks.length === 0) {
		const now = new Date();
		return [now, addHours(now, 720)];
	}

	let minMs = Infinity;
	let maxMs = -Infinity;

	for (const task of tasks) {
		const start = parseDate(task.startDate);
		const end = addHours(start, task.durationHours);
		if (start.getTime() < minMs) {
			minMs = start.getTime();
		}
		if (end.getTime() > maxMs) {
			maxMs = end.getTime();
		}
	}

	return [addHours(new Date(minMs), -paddingHours), addHours(new Date(maxMs), paddingHours)];
}
