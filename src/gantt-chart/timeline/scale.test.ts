import {describe, expect, it} from 'vitest';
import {nextScaleBoundary, snapToScaleBoundary} from './scale.ts';

describe('scale boundary cadence', () => {
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

	it('steps quarter and year scales on canonical starts', () => {
		const source = new Date('2026-08-19T05:30:00.000Z');
		const quarterStart = snapToScaleBoundary(source, 'quarter');
		expect(quarterStart.toISOString()).toBe('2026-07-01T00:00:00.000Z');
		expect(nextScaleBoundary(quarterStart, 'quarter').toISOString()).toBe('2026-10-01T00:00:00.000Z');

		const yearStart = snapToScaleBoundary(source, 'year');
		expect(yearStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(nextScaleBoundary(yearStart, 'year').toISOString()).toBe('2027-01-01T00:00:00.000Z');
	});
});
