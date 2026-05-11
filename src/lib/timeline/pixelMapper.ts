import {SCALE_CONFIGS} from './scale.ts';
import {type TimeScale} from './scale.ts';

export type PixelMapper = {
	/** Date → x pixel offset from viewport start */
	toX: (date: Date) => number;
	/** x pixel offset → Date */
	toDate: (x: number) => Date;
	/** Days → pixel width */
	durationDaysToWidth: (days: number) => number;
	/** Pixel width → days (float) */
	widthToDurationDays: (px: number) => number;
	/** The origin timestamp used for this mapper */
	originMs: number;
	/** Pixel width of one column unit */
	columnWidth: number;
};

/**
 * Creates a stateless pixel mapper for the given scale and viewport start.
 * All conversions are O(1) arithmetic — safe to call in tight loops.
 *
 * @param scale - The active {@link TimeScale}.
 * @param viewportStart - The leftmost date visible in the viewport.
 * @returns A {@link PixelMapper} configured for the given viewport.
 */
export function createPixelMapper(scale: TimeScale, viewportStart: Date): PixelMapper {
	const {columnWidth, msPerColumn} = SCALE_CONFIGS[scale];
	const originMs = viewportStart.getTime();
	const pxPerMs = columnWidth / msPerColumn;
	const msPerPx = msPerColumn / columnWidth;
	const msPerDay = 86_400_000;

	return {
		originMs,
		columnWidth,
		toX(date: Date): number {
			return (date.getTime() - originMs) * pxPerMs;
		},
		toDate(x: number): Date {
			return new Date(originMs + x * msPerPx);
		},
		durationDaysToWidth(days: number): number {
			return days * msPerDay * pxPerMs;
		},
		widthToDurationDays(px: number): number {
			return (px * msPerPx) / msPerDay;
		},
	};
}
