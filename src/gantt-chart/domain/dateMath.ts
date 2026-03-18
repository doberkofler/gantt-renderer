import {type TimeScale} from '../timeline/scale.ts';
import {type ChartLocale, EN_US_LABELS, formatWeekNumber} from '../locale.ts';

/** Parses YYYY-MM-DD → UTC midnight Date. Throws on invalid input. */
export function parseDate(dateStr: string): Date {
	const d = new Date(`${dateStr}T00:00:00.000Z`);
	if (isNaN(d.getTime())) {
		throw new Error(`Invalid date: "${dateStr}"`);
	}
	return d;
}

/** Returns date + n days (exact ms arithmetic). */
export function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 86_400_000);
}

/** Difference in days (float). Positive when b > a. */
export function diffDays(a: Date, b: Date): number {
	return (b.getTime() - a.getTime()) / 86_400_000;
}

/** UTC start-of-day. */
export function startOfDay(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * UTC start-of-week. Respects locale's weekStartsOn (0=Sun, 1=Mon, 6=Sat).
 * Defaults to Monday when locale is omitted.
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
	const d = startOfDay(date);
	const dow = d.getUTCDay();
	const offset = (((dow - weekStartsOn) % 7) + 7) % 7;
	return addDays(d, -offset);
}

/** UTC start-of-month. */
export function startOfMonth(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** UTC start-of-quarter. */
export function startOfQuarter(date: Date): Date {
	const month = date.getUTCMonth();
	const quarterStartMonth = Math.floor(month / 3) * 3;
	return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

/** UTC start-of-year. */
export function startOfYear(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/** UTC start-of-hour. */
export function startOfHour(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

/**
 * Formats a Date for the time-header label given the active scale.
 */
export function formatHeaderLabel(date: Date, scale: TimeScale, locale: ChartLocale): string {
	const {code, weekNumbering: weekNumScheme = 'iso'} = locale;
	switch (scale) {
		case 'hour': {
			return `${String(date.getUTCHours()).padStart(2, '0')}:00`;
		}
		case 'day': {
			const day = date.toLocaleDateString(code, {weekday: 'short', timeZone: 'UTC'});
			return `${date.getUTCDate()} ${day}`;
		}
		case 'week': {
			const wn = formatWeekNumber(date, weekNumScheme);
			return `W${wn}`;
		}
		case 'month': {
			return date.toLocaleDateString(code, {month: 'short', year: 'numeric', timeZone: 'UTC'});
		}
		case 'quarter': {
			return `${resolveQuarterLabel(locale)}${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
		}
		case 'year': {
			return `${date.getUTCFullYear()}`;
		}
	}
}

/**
 * Returns the upper-level (month/year) label for a given scale column.
 * Used in the top header row.
 */
export function formatUpperLabel(date: Date, scale: TimeScale, locale: ChartLocale): string {
	const {code} = locale;
	switch (scale) {
		case 'hour': {
			return date.toLocaleDateString(code, {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
		}
		case 'day':
		case 'week': {
			return date.toLocaleDateString(code, {month: 'long', year: 'numeric', timeZone: 'UTC'});
		}
		case 'month': {
			return `${date.getUTCFullYear()}`;
		}
		case 'quarter': {
			return `${date.getUTCFullYear()}`;
		}
		case 'year': {
			return `${date.getUTCFullYear()}`;
		}
	}
}

function resolveQuarterLabel(locale: ChartLocale): string {
	if (locale.labels?.column_quarter !== undefined) {
		return locale.labels.column_quarter;
	}
	return EN_US_LABELS.column_quarter;
}

/** Formats YYYY-MM-DD for display in the grid. */
export function formatDisplayDate(dateStr: string, locale: ChartLocale): string {
	const d = parseDate(dateStr);
	return d.toLocaleDateString(locale.code, {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'});
}
