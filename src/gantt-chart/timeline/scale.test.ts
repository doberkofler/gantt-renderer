import {describe, expect, it} from 'vitest';
import {nextScaleBoundary, snapToScaleBoundary} from './scale.ts';

describe('snapToScaleBoundary', () => {
	it('snaps to hour boundary', () => {
		const d = new Date('2026-01-15T14:30:45.000Z');
		const snapped = snapToScaleBoundary(d, 'hour');
		expect(snapped.toISOString()).toBe('2026-01-15T14:00:00.000Z');
	});

	it('snaps to day boundary', () => {
		const d = new Date('2026-01-15T14:30:45.000Z');
		const snapped = snapToScaleBoundary(d, 'day');
		expect(snapped.toISOString()).toBe('2026-01-15T00:00:00.000Z');
	});

	it('snaps to week boundary with default Monday start', () => {
		const d = new Date('2026-01-15T00:00:00.000Z');
		const snapped = snapToScaleBoundary(d, 'week');
		expect(snapped.toISOString()).toBe('2026-01-12T00:00:00.000Z');
	});

	it('snaps to week boundary with Sunday start (weekStartsOn=0)', () => {
		const d = new Date('2026-01-15T00:00:00.000Z');
		const snapped = snapToScaleBoundary(d, 'week', 0);
		expect(snapped.toISOString()).toBe('2026-01-11T00:00:00.000Z');
	});

	it('snaps to week boundary with Saturday start (weekStartsOn=6)', () => {
		const d = new Date('2026-01-15T00:00:00.000Z');
		const snapped = snapToScaleBoundary(d, 'week', 6);
		expect(snapped.toISOString()).toBe('2026-01-10T00:00:00.000Z');
	});

	it('week snap: date already on boundary stays same', () => {
		const d = new Date('2026-01-12T00:00:00.000Z');
		const snapped = snapToScaleBoundary(d, 'week', 1);
		expect(snapped.toISOString()).toBe('2026-01-12T00:00:00.000Z');
	});

	it('snaps and steps month scale on calendar boundaries', () => {
		const source = new Date('2026-01-31T18:12:00.000Z');
		const start = snapToScaleBoundary(source, 'month');
		expect(start.toISOString()).toBe('2026-01-01T00:00:00.000Z');

		const feb = nextScaleBoundary(start, 'month');
		const mar = nextScaleBoundary(feb, 'month');
		const apr = nextScaleBoundary(mar, 'month');

		expect(feb.toISOString()).toBe('2026-02-01T00:00:00.000Z');
		expect(mar.toISOString()).toBe('2026-03-01T00:00:00.000Z');
		expect(apr.toISOString()).toBe('2026-04-01T00:00:00.000Z');
	});

	it('snaps quarter and year scales on canonical starts', () => {
		const source = new Date('2026-08-19T05:30:00.000Z');
		const quarterStart = snapToScaleBoundary(source, 'quarter');
		expect(quarterStart.toISOString()).toBe('2026-07-01T00:00:00.000Z');

		const yearStart = snapToScaleBoundary(source, 'year');
		expect(yearStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
	});
});

describe('nextScaleBoundary', () => {
	it('steps hour scale', () => {
		const d = new Date('2026-01-15T14:00:00.000Z');
		const next = nextScaleBoundary(d, 'hour');
		expect(next.toISOString()).toBe('2026-01-15T15:00:00.000Z');
	});

	it('steps day scale', () => {
		const d = new Date('2026-01-15T00:00:00.000Z');
		const next = nextScaleBoundary(d, 'day');
		expect(next.toISOString()).toBe('2026-01-16T00:00:00.000Z');
	});

	it('steps week scale', () => {
		const d = new Date('2026-01-12T00:00:00.000Z');
		const next = nextScaleBoundary(d, 'week');
		expect(next.toISOString()).toBe('2026-01-19T00:00:00.000Z');
	});

	it('steps quarter scale on canonical boundary', () => {
		const d = new Date('2026-07-01T00:00:00.000Z');
		expect(nextScaleBoundary(d, 'quarter').toISOString()).toBe('2026-10-01T00:00:00.000Z');
	});

	it('steps year scale on canonical boundary', () => {
		const d = new Date('2026-01-01T00:00:00.000Z');
		expect(nextScaleBoundary(d, 'year').toISOString()).toBe('2027-01-01T00:00:00.000Z');
	});
});
