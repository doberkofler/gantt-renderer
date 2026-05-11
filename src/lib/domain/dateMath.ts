import {type TimeScale} from '../timeline/scale.ts';
import {type ChartLocale, EN_US_LABELS, formatWeekNumber} from '../locale.ts';

/**
 * Parses `YYYY-MM-DD` → UTC midnight `Date`.
 *
 * @param dateStr - An ISO-8601 date string in `YYYY-MM-DD` format.
 * @returns A `Date` representing UTC midnight of the given date.
 * @throws {Error} When `dateStr` does not represent a valid date.
 */
export function parseDate(dateStr: string): Date {
	const d = new Date(`${dateStr}T00:00:00.000Z`);
	if (isNaN(d.getTime())) {
		throw new Error(`Invalid date: "${dateStr}"`);
	}
	return d;
}

/**
 * Returns `date + n` days using exact millisecond arithmetic.
 *
 * @param date - The base date.
 * @param days - Number of days to add (may be negative).
 * @returns A new `Date` offset by the given number of days.
 */
export function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 86_400_000);
}

/**
 * Returns `date + n` hours using exact millisecond arithmetic.
 *
 * @param date - The base date.
 * @param hours - Number of hours to add (may be negative).
 * @returns A new `Date` offset by the given number of hours.
 */
export function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 3_600_000);
}

/**
 * Difference in days (float). Positive when `b > a`.
 *
 * @param a - The earlier date.
 * @param b - The later date.
 * @returns The fractional number of days between the two dates.
 */
export function diffDays(a: Date, b: Date): number {
	return (b.getTime() - a.getTime()) / 86_400_000;
}

/**
 * Difference in hours (float). Positive when `b > a`.
 *
 * @param a - The earlier date.
 * @param b - The later date.
 * @returns The fractional number of hours between the two dates.
 */
export function diffHours(a: Date, b: Date): number {
	return (b.getTime() - a.getTime()) / 3_600_000;
}

/**
 * Returns the UTC start-of-day for the given date.
 *
 * @param date - Any `Date`.
 * @returns A new `Date` set to UTC midnight of the same calendar date.
 */
export function startOfDay(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * UTC start-of-week. Respects locale's `weekStartsOn` (0=Sun, 1=Mon, 6=Sat).
 *
 * @param date - Any `Date`.
 * @param weekStartsOn - First day of the week (`0`-Sun, `1`-Mon, `6`-Sat). Defaults to `1` (Monday).
 * @returns A new `Date` set to UTC midnight of the first day of the containing week.
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
	const d = startOfDay(date);
	const dow = d.getUTCDay();
	const offset = (((dow - weekStartsOn) % 7) + 7) % 7;
	return addDays(d, -offset);
}

/**
 * Returns the UTC start-of-month for the given date.
 *
 * @param date - Any `Date`.
 * @returns A new `Date` set to UTC midnight of the first day of the containing month.
 */
export function startOfMonth(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Returns the UTC start-of-quarter for the given date.
 *
 * @param date - Any `Date`.
 * @returns A new `Date` set to UTC midnight of the first day of the containing quarter.
 */
export function startOfQuarter(date: Date): Date {
	const month = date.getUTCMonth();
	const quarterStartMonth = Math.floor(month / 3) * 3;
	return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

/**
 * Returns the UTC start-of-year for the given date.
 *
 * @param date - Any `Date`.
 * @returns A new `Date` set to UTC midnight of January 1 of the containing year.
 */
export function startOfYear(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/**
 * Returns the UTC start-of-hour for the given date.
 *
 * @param date - Any `Date`.
 * @returns A new `Date` set to the start of the containing UTC hour.
 */
export function startOfHour(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

function resolveQuarterLabel(locale: ChartLocale): string {
	if (locale.labels?.columnQuarter !== undefined) {
		return locale.labels.columnQuarter;
	}
	return EN_US_LABELS.columnQuarter;
}

/**
 * Formats a `Date` for the time-header label given the active scale.
 *
 * @param date - The date to format.
 * @param scale - The active {@link TimeScale} determining the label granularity.
 * @param locale - The {@link ChartLocale} used for formatting.
 * @returns A human-readable header label string.
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
 * Used in the top header row of the timeline.
 *
 * @param date - The date to format.
 * @param scale - The active {@link TimeScale}. Determines how the upper label is computed.
 * @param locale - The {@link ChartLocale} used for formatting.
 * @returns A human-readable upper-level header label string.
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

/**
 * Returns the number of days in an inclusive range from `start` to `end`.
 *
 * @param start - The start date.
 * @param end - The end date.
 * @returns The number of days, inclusive.
 */
export function getRangeDays(start: Date, end: Date): number {
	return Math.round(diffDays(start, end)) + 1;
}

/**
 * Calculates the end date for an inclusive range starting at `start` with a given duration in days.
 *
 * @param start - The start date.
 * @param durationDays - The number of days in the range (must be >= 1).
 * @returns The end date.
 */
export function getEndDate(start: Date, durationDays: number): Date {
	return addDays(start, Math.max(0, durationDays - 1));
}

/**
 * Formats a `YYYY-MM-DD` string for display in the grid.
 *
 * @param dateStr - An ISO-8601 date string in `YYYY-MM-DD` format.
 * @param locale - The {@link ChartLocale} used for locale-aware formatting.
 * @returns A locale-formatted date string.
 */
export function formatDisplayDate(dateStr: string, locale: ChartLocale): string {
	const d = parseDate(dateStr);
	return d.toLocaleDateString(locale.code, {year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'});
}
