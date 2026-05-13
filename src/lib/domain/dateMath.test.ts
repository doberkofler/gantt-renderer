import {describe, expect, it} from 'vitest';
import {
	addDays,
	addHours,
	diffDays,
	diffHours,
	formatDisplayDate,
	formatHeaderLabel,
	formatUpperLabel,
	getEndDate,
	getRangeDays,
	parseDate,
	startOfDay,
	startOfHour,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfYear,
} from './dateMath.ts';
import {type ChartLocale} from '../locale.ts';

const EN_US: ChartLocale = {code: 'en', weekStartsOn: 0, weekNumbering: 'iso', weekendDays: [0, 6]};

describe('dateMath utilities', () => {
	it('parses valid ISO date and throws on invalid date', () => {
		expect(parseDate('2026-01-15').toISOString()).toBe('2026-01-15T00:00:00.000Z');
		expect(() => parseDate('not-a-date')).toThrow('Invalid date');
	});

	it('adds and diffs days using UTC-safe arithmetic', () => {
		const start = parseDate('2026-01-01');
		const end = addDays(start, 10);
		expect(end.toISOString()).toBe('2026-01-11T00:00:00.000Z');
		expect(diffDays(start, end)).toBe(10);
	});

	it('computes start-of-day/week/month/hour in UTC', () => {
		const source = new Date('2026-02-18T15:47:13.000Z');
		expect(startOfDay(source).toISOString()).toBe('2026-02-18T00:00:00.000Z');
		expect(startOfWeek(source).toISOString()).toBe('2026-02-16T00:00:00.000Z');
		expect(startOfMonth(source).toISOString()).toBe('2026-02-01T00:00:00.000Z');
		expect(startOfQuarter(source).toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(startOfYear(source).toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(startOfHour(source).toISOString()).toBe('2026-02-18T15:00:00.000Z');
	});

	it('formats header and upper labels across scales', () => {
		const date = new Date('2026-03-10T09:00:00.000Z');
		expect(formatHeaderLabel(date, 'hour', EN_US)).toBe('09:00');
		expect(formatHeaderLabel(date, 'day', EN_US)).toBe('10 Tue');
		expect(formatHeaderLabel(date, 'week', EN_US)).toBe('W11');
		expect(formatHeaderLabel(date, 'month', EN_US)).toBe('Mar 2026');
		expect(formatHeaderLabel(date, 'quarter', EN_US)).toBe('Q1 2026');
		expect(formatHeaderLabel(date, 'year', EN_US)).toBe('2026');

		expect(formatUpperLabel(date, 'hour', EN_US)).toBe('March 10, 2026');
		expect(formatUpperLabel(date, 'day', EN_US)).toBe('March 2026');
		expect(formatUpperLabel(date, 'week', EN_US)).toBe('March 2026');
		expect(formatUpperLabel(date, 'month', EN_US)).toBe('2026');
		expect(formatUpperLabel(date, 'quarter', EN_US)).toBe('2026');
		expect(formatUpperLabel(date, 'year', EN_US)).toBe('2026');
	});

	it('formats display date as MM/DD/YYYY', () => {
		expect(formatDisplayDate('2026-03-10', EN_US)).toBe('03/10/2026');
	});

	it('startOfWeek respects weekStartsOn', () => {
		const source = new Date('2026-05-03T00:00:00.000Z'); // Sunday
		expect(startOfWeek(source, 0).toISOString()).toBe('2026-05-03T00:00:00.000Z'); // Sun start
		expect(startOfWeek(source, 1).toISOString()).toBe('2026-04-27T00:00:00.000Z'); // Mon start
		expect(startOfWeek(source, 6).toISOString()).toBe('2026-05-02T00:00:00.000Z'); // Sat start
	});

	it('startOfWeek default (Monday) matches previous behavior', () => {
		const source = new Date('2026-02-18T15:47:13.000Z');
		expect(startOfWeek(source).toISOString()).toBe('2026-02-16T00:00:00.000Z');
	});

	it('adds and diffs hours', () => {
		const start = parseDate('2026-01-01');
		expect(addHours(start, 5).toISOString()).toBe('2026-01-01T05:00:00.000Z');
		expect(diffHours(start, addHours(start, 8))).toBe(8);
	});

	it('formats quarter label with fallback when no custom columnQuarter label', () => {
		const localeWithoutQuarter: ChartLocale = {code: 'de-DE', labels: {}};
		const date = new Date('2026-03-10T09:00:00.000Z');
		expect(formatHeaderLabel(date, 'quarter', localeWithoutQuarter)).toBe('Q1 2026');
	});

	it('inclusive range helpers', () => {
		const start = parseDate('2026-01-01');
		const end = parseDate('2026-01-05');

		// 1st, 2nd, 3rd, 4th, 5th = 5 days
		expect(getRangeDays(start, end)).toBe(5);

		// duration 1 -> end is start
		expect(getEndDate(start, 1).toISOString()).toBe(start.toISOString());

		// duration 5 -> end is start + 4 days
		expect(getEndDate(start, 5).toISOString()).toBe('2026-01-05T00:00:00.000Z');

		// duration 0 -> end is start (safeguard)
		expect(getEndDate(start, 0).toISOString()).toBe(start.toISOString());
	});
});
