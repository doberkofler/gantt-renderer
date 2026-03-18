import {describe, expect, it} from 'vitest';
import {GanttChart} from './gantt-chart.ts';
import {INPUT, SPECIAL_DAYS} from './gantt-chart.test-utils.ts';

describe('special days', () => {
	it('does not render today marker when today is outside viewport range', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const now = new Date();
		const pastYear = now.getFullYear() - 10;

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			viewportStart: new Date(pastYear, 0, 1),
			viewportEnd: new Date(pastYear, 0, 10),
		});

		expect(container.querySelector('.gantt-today-marker')).toBeNull();
	});

	it('renders today marker when today is within viewport range', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5);
		const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			viewportStart: start,
			viewportEnd: end,
		});

		expect(container.querySelector('.gantt-today-marker')).not.toBeNull();
	});

	it('renders weekend day backgrounds by default in day scale', () => {
		const container = document.createElement('div');
		document.body.append(container);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			viewportStart: new Date('2026-02-06T00:00:00.000Z'),
			viewportEnd: new Date('2026-02-10T00:00:00.000Z'),
		});

		expect(container.querySelector('.gantt-day-cell--weekend[data-date="2026-02-07"]')).not.toBeNull();
		expect(container.querySelector('.gantt-day-cell--weekend[data-date="2026-02-08"]')).not.toBeNull();
	});

	it('can disable weekend day backgrounds', () => {
		const container = document.createElement('div');
		document.body.append(container);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			showWeekends: false,
			viewportStart: new Date('2026-02-06T00:00:00.000Z'),
			viewportEnd: new Date('2026-02-10T00:00:00.000Z'),
		});

		expect(container.querySelector('.gantt-day-cell--weekend')).toBeNull();
	});

	it('supports configurable weekend days for locale or project calendar', () => {
		const container = document.createElement('div');
		document.body.append(container);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			weekendDays: [5, 6],
			viewportStart: new Date('2026-02-05T00:00:00.000Z'),
			viewportEnd: new Date('2026-02-09T00:00:00.000Z'),
		});

		expect(container.querySelector('.gantt-day-cell--weekend[data-date="2026-02-06"]')).not.toBeNull();
		expect(container.querySelector('.gantt-day-cell--weekend[data-date="2026-02-07"]')).not.toBeNull();
		expect(container.querySelector('.gantt-day-cell--weekend[data-date="2026-02-08"]')).toBeNull();
	});

	it('renders holiday and custom special day classes with labels', () => {
		const container = document.createElement('div');
		document.body.append(container);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			specialDays: SPECIAL_DAYS,
			viewportStart: new Date('2026-02-10T00:00:00.000Z'),
			viewportEnd: new Date('2026-02-13T00:00:00.000Z'),
		});

		const customDay = container.querySelector<HTMLElement>('.gantt-day-cell--custom[data-date="2026-02-11"]');
		expect(customDay).not.toBeNull();
		expect(customDay?.dataset['label']).toBe('Release Freeze');

		const holidayContainer = document.createElement('div');
		document.body.append(holidayContainer);
		// eslint-disable-next-line no-new
		new GanttChart(holidayContainer, INPUT, {
			scale: 'day',
			specialDays: SPECIAL_DAYS,
			viewportStart: new Date('2026-05-24T00:00:00.000Z'),
			viewportEnd: new Date('2026-05-27T00:00:00.000Z'),
		});
		expect(holidayContainer.querySelector('.gantt-day-cell--holiday[data-date="2026-05-25"]')).not.toBeNull();
		expect(holidayContainer.querySelector('.holiday-memorial-day')).not.toBeNull();
	});

	it('renders deterministically for date-only special days in any local timezone', () => {
		const container = document.createElement('div');
		document.body.append(container);

		// eslint-disable-next-line no-new
		new GanttChart(container, INPUT, {
			scale: 'day',
			specialDays: SPECIAL_DAYS,
			viewportStart: new Date('2026-12-24T00:00:00.000Z'),
			viewportEnd: new Date('2026-12-27T00:00:00.000Z'),
		});

		expect(container.querySelector('.gantt-day-cell--holiday[data-date="2026-12-25"]')).not.toBeNull();
	});

	it('rejects invalid weekendDays values', () => {
		const container = document.createElement('div');
		document.body.append(container);

		expect(() => {
			// eslint-disable-next-line no-new
			new GanttChart(container, INPUT, {
				scale: 'day',
				weekendDays: [7],
			});
		}).toThrow('weekendDays must contain integers in range 0..6');
	});
});
