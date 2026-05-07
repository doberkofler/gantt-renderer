export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type ScaleConfig = {
	/** Pixel width of one column unit */
	columnWidth: number;
	/** Milliseconds per column unit */
	msPerColumn: number;
	headerFormat: TimeScale;
};

const H = 3_600_000;
const D = 86_400_000;

export const SCALE_CONFIGS: Record<TimeScale, ScaleConfig> = {
	hour: {columnWidth: 60, msPerColumn: H, headerFormat: 'hour'},
	day: {columnWidth: 72, msPerColumn: D, headerFormat: 'day'},
	week: {columnWidth: 120, msPerColumn: 7 * D, headerFormat: 'week'},
	month: {columnWidth: 160, msPerColumn: 30 * D, headerFormat: 'month'},
	quarter: {columnWidth: 220, msPerColumn: 91 * D, headerFormat: 'quarter'},
	year: {columnWidth: 280, msPerColumn: 365 * D, headerFormat: 'year'},
};

/**
 * Snaps a date to the column boundary for the provided scale.
 * All operations use UTC semantics.
 * The week boundary respects the optional `weekStartsOn` override (0=Sun, 1=Mon, 6=Sat).
 *
 * @param date - The date to snap.
 * @param scale - The target {@link TimeScale}.
 * @param weekStartsOn - First day of the week (`0`-Sun, `1`-Mon, `6`-Sat). Defaults to `1` (Monday).
 * @returns A new `Date` snapped to the column boundary.
 */
export function snapToScaleBoundary(date: Date, scale: TimeScale, weekStartsOn: 0 | 1 | 6 = 1): Date {
	switch (scale) {
		case 'hour': {
			return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
		}
		case 'day': {
			return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		}
		case 'week': {
			const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
			const dow = d.getUTCDay();
			const offset = (((dow - weekStartsOn) % 7) + 7) % 7;
			d.setUTCDate(d.getUTCDate() - offset);
			return d;
		}
		case 'month': {
			return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
		}
		case 'quarter': {
			const month = date.getUTCMonth();
			const quarterStartMonth = Math.floor(month / 3) * 3;
			return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
		}
		case 'year': {
			return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		}
	}
}

/**
 * Returns the next column boundary from a boundary-aligned date.
 * Month/quarter/year use true calendar stepping (not fixed-day approximations).
 *
 * @param date - A boundary-aligned date.
 * @param scale - The target {@link TimeScale}.
 * @returns The next boundary date.
 */
export function nextScaleBoundary(date: Date, scale: TimeScale): Date {
	switch (scale) {
		case 'hour': {
			return new Date(date.getTime() + H);
		}
		case 'day': {
			return new Date(date.getTime() + D);
		}
		case 'week': {
			return new Date(date.getTime() + 7 * D);
		}
		case 'month': {
			return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
		}
		case 'quarter': {
			return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 3, 1));
		}
		case 'year': {
			return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1));
		}
	}
}
