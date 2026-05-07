import {describe, expect, it} from 'vitest';
import {GanttChart} from './gantt-chart.ts';
import {DENSITY} from '../timeline/layoutEngine.ts';
import {INPUT} from './gantt-chart.test-utils.ts';

describe('density', () => {
	it('renders rows and milestones with density-constant dimensions', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const chart = new GanttChart(container, {scale: 'day'});
		chart.update(INPUT);

		const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
		expect(rightPane).not.toBeNull();

		const allElems = rightPane?.querySelectorAll<HTMLElement>('[style*="height"]') ?? [];
		let stripeCount = 0;
		for (const el of allElems) {
			if (el.style.height === `${DENSITY.rowHeight}px`) {
				stripeCount += 1;
			}
		}
		expect(stripeCount).toBeGreaterThanOrEqual(1);

		const milestone = container.querySelector<HTMLElement>('.gantt-milestone');
		expect(milestone).not.toBeNull();
		const mw = milestone?.style.width;
		const mh = milestone?.style.height;
		expect(mw).toBe(`${DENSITY.milestoneSize}px`);
		expect(mh).toBe(`${DENSITY.milestoneSize}px`);
	});

	it('keeps bar height equal to density constant', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const chart = new GanttChart(container, {scale: 'day'});
		chart.update(INPUT);

		const bar = container.querySelector<HTMLElement>('.gantt-bar');
		expect(bar).not.toBeNull();
		expect(bar?.style.height).toBe(`${DENSITY.barHeight}px`);
	});
});
