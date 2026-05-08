import {expect, test, type Locator} from '@playwright/test';
import {setTimeout as delay} from 'node:timers/promises';

async function waitForBoundingBox(locator: Locator, errorMessage: string, timeoutMs = 3000): Promise<{x: number; y: number; width: number; height: number}> {
	// oxlint-disable eslint/no-await-in-loop -- polling requires sequential awaits
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const box = await locator.boundingBox();
		if (box !== null) {
			return box;
		}
		await delay(50);
	}
	throw new Error(errorMessage);
}

test.describe('gantt chart UX regressions', () => {
	test.beforeEach(async ({page}) => {
		await page.goto('/');
	});

	test('renders core chart UI', async ({page}) => {
		await expect(page.locator('.gantt-root')).toBeVisible();
		await expect(page.locator('#scale-select')).toBeVisible();
		await expect(page.locator('#scale-select')).toHaveValue('day');
		await expect(page.locator('#control-collapse-all')).toBeVisible();
		await expect(page.locator('#control-expand-all')).toBeVisible();
		await expect(page.locator('#control-select')).toHaveCount(0);
		await expect(page.locator('.gantt-bar[data-task-id="1000"]')).toBeVisible();
		await expect(page.locator('.gantt-milestone[data-task-id="1140"]')).toBeVisible();
	});

	test('provides tooltips for demo-shell controls', async ({page}) => {
		await expect(page.locator('#control-collapse-all')).toHaveAttribute('title', 'Collapse all expandable groups');
		await expect(page.locator('#control-expand-all')).toHaveAttribute('title', 'Expand all collapsed groups');
		await expect(page.locator('#fullscreen-btn')).toHaveAttribute('title', 'Toggle fullscreen mode');
		await expect(page.locator('#scale-select')).toHaveAttribute('title', 'Choose timeline scale');
		await expect(page.locator('#toggle-link-creation')).toHaveAttribute('title', 'Enable/disable drag-to-create dependency links');
		await expect(page.locator('#toggle-highlight-deps')).toHaveAttribute('title', 'Highlight dependency arrows on task selection');
		await expect(page.locator('#toggle-show-weekends')).toHaveAttribute('title', 'Show/hide weekend day backgrounds');
		await expect(page.locator('#toggle-responsive')).toHaveAttribute('title', 'Enable/disable responsive split pane behavior');
	});

	test('keeps selection on repeated click', async ({page}) => {
		const eventLog = page.locator('#event-log');
		const taskRow = page.locator('.gantt-root [role="row"][data-task-id="1341"]');
		await expect(eventLog).toHaveValue(/demo initialized/u);

		await taskRow.click();
		await expect(eventLog).toHaveValue(/selected Billing Connector/u);

		await taskRow.click();
		await expect(eventLog).not.toHaveValue(/selection cleared/u);
	});

	test('logs edit intent on double click in timeline bar', async ({page}) => {
		const eventLog = page.locator('#event-log');
		const taskBar = page.locator('.gantt-root .gantt-bar[data-task-id="1110"]');

		await taskBar.dblclick();
		await taskBar.dblclick();
		await expect(eventLog).toHaveValue(/edit intent Stakeholder Interviews/u);

		const logValue = await eventLog.inputValue();
		const selectedMatches = logValue.match(/selected Stakeholder Interviews/gu) ?? [];
		expect(selectedMatches).toHaveLength(1);
	});

	test('collapses and expands tree rows', async ({page}) => {
		const milestoneRow = page.locator('.gantt-root [role="row"][data-task-id="1140"]');
		const collapseToggle = page.locator('.gantt-root [role="row"][data-task-id="1000"] .gantt-toggle');
		await expect(milestoneRow).toBeVisible();

		await collapseToggle.click();
		await expect(milestoneRow).toBeHidden();

		await collapseToggle.click();
		await expect(milestoneRow).toBeVisible();
	});

	test('collapses and expands all rows through demo controls', async ({page}) => {
		const rows = page.locator('.gantt-root [role="row"]');
		const collapseAll = page.locator('#control-collapse-all');
		const expandAll = page.locator('#control-expand-all');
		const eventLog = page.locator('#event-log');

		await expect(rows).toHaveCount(16);

		await collapseAll.click();
		await expect(rows).toHaveCount(1);
		await expect(eventLog).toHaveValue(/control-collapse-all \| integrated/u);

		await collapseAll.click();
		await expect(rows).toHaveCount(1);

		await expandAll.click();
		await expect(rows).toHaveCount(16);
		await expect(eventLog).toHaveValue(/control-expand-all \| integrated/u);

		await expandAll.click();
		await expect(rows).toHaveCount(16);
	});

	test('switches scale using demo controls', async ({page}) => {
		const scaleSelect = page.locator('#scale-select');
		const eventLog = page.locator('#event-log');

		await expect(scaleSelect).toHaveValue('day');
		await scaleSelect.selectOption('month');
		await expect(scaleSelect).toHaveValue('month');
		await expect(eventLog).toHaveValue(/scale-select \| integrated \| value=month/u);

		await scaleSelect.selectOption('quarter');
		await expect(scaleSelect).toHaveValue('quarter');
		await expect(eventLog).toHaveValue(/scale-select \| integrated \| value=quarter/u);

		await scaleSelect.selectOption('year');
		await expect(scaleSelect).toHaveValue('year');
		await expect(eventLog).toHaveValue(/scale-select \| integrated \| value=year/u);
	});

	test('toggles gantt options and logs changes', async ({page}) => {
		const eventLog = page.locator('#event-log');
		const weekendsToggle = page.locator('#toggle-show-weekends');
		const highlightToggle = page.locator('#toggle-highlight-deps');

		await expect(weekendsToggle).toBeChecked();
		await weekendsToggle.uncheck();
		await expect(weekendsToggle).not.toBeChecked();
		await expect(eventLog).toHaveValue(/toggle-show-weekends \| toggled \| value=off/u);

		await highlightToggle.check();
		await expect(highlightToggle).toBeChecked();
		await expect(eventLog).toHaveValue(/toggle-highlight-deps \| toggled \| value=on/u);
	});

	test('does not highlight dependency links for selected task by default', async ({page}) => {
		const links = page.locator('svg path[marker-end]');
		await expect(links.first()).toBeVisible();

		const normalStroke = await links.first().getAttribute('stroke');
		expect(normalStroke).toBe('var(--gantt-link)');

		await page.locator('.gantt-root [role="row"][data-task-id="1210"]').click();

		await expect
			.poll(async () => {
				const highlightedCount = await links.evaluateAll(
					(paths) =>
						paths.filter((path) => {
							const stroke = path.getAttribute('stroke') ?? '';
							const markerEnd = path.getAttribute('marker-end') ?? '';
							return stroke.includes('--gantt-link-hi') || markerEnd.includes('gantt-arrow-hi');
						}).length,
				);
				return highlightedCount;
			})
			.toBe(0);
	});

	test('keeps virtualized row count stable while scrolling', async ({page}) => {
		const scrollHost = page.locator('.gantt-root > div').first();
		const visibleRows = page.locator('.gantt-root [role="row"]');
		await expect(scrollHost).toBeVisible();

		const before = await visibleRows.count();
		expect(before).toBeGreaterThan(0);

		await scrollHost.evaluate((el) => {
			el.scrollTop = 1200;
			el.dispatchEvent(new Event('scroll'));
		});
		await expect
			.poll(async () => {
				const rowCount = await visibleRows.count();
				return rowCount;
			})
			.toBeGreaterThan(0);

		const after = await visibleRows.count();
		expect(after).toBeGreaterThan(0);
		expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
	});

	test('drag and resize produce identical day deltas across all zoom levels', async ({page}) => {
		const SCALES = ['hour', 'day', 'week', 'month', 'quarter', 'year'] as const;
		const TASK_ID = 1000;
		const PX_DELTA: Record<string, number> = {hour: 2880, day: 288, week: 120, month: 320, quarter: 440, year: 560};
		const SCROLL_MARGIN = 400;

		const scrollEl = page.locator('.gantt-root > div').first();

		async function waitForScaleChangeRender(bar: Locator, baselineWidth: number, scale: string): Promise<void> {
			await expect(bar).toBeVisible();
			try {
				await expect
					.poll(
						async () => {
							const w = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));
							return w;
						},
						{timeout: 3000},
					)
					.not.toBe(baselineWidth);
			} catch {
				// Width unchanged — same scale as baseline or slow render; proceed
			}
			await expect
				.poll(
					async () => {
						const w = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));
						return w;
					},
					{message: `bar width should be > 0 at scale ${scale}`, timeout: 5000},
				)
				.toBeGreaterThan(10);
		}

		// oxlint-disable eslint/no-await-in-loop -- sequential per-scale navigation is required
		for (const scale of SCALES) {
			const delta = PX_DELTA[scale] ?? 100;

			// ── DRAG (move) leg ──
			await page.goto('/');
			await page.waitForSelector('.gantt-bar[data-task-id="1000"]');

			const bar = page.locator(`.gantt-bar[data-task-id="${TASK_ID}"]`);
			await expect(bar).toBeVisible();
			const baselineWidth = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));

			await page.locator('#scale-select').selectOption(scale);
			await waitForScaleChangeRender(bar, baselineWidth, scale);

			const leftBefore = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.left || '0'));

			await scrollEl.evaluate(
				(el, {x, margin}: {x: number; margin: number}) => {
					el.scrollLeft = Math.max(0, x - margin);
				},
				{x: leftBefore, margin: SCROLL_MARGIN},
			);
			const box = await waitForBoundingBox(bar, `Bar ${TASK_ID} not visible at scale ${scale}`);
			const cx = box.x + Math.min(50, box.width * 0.25);
			const cy = box.y + box.height / 2;

			// Use PointerEvent dispatch for reliable cross-browser drag simulation
			await page.evaluate(
				({taskId, startX, startY, d}: {taskId: number; startX: number; startY: number; d: number}) => {
					const el = document.querySelector(`.gantt-bar[data-task-id="${taskId}"]`);
					if (!el) {
						return;
					}

					const finalX = startX + d;
					const finalY = startY;

					el.dispatchEvent(
						new PointerEvent('pointerdown', {
							clientX: startX,
							clientY: startY,
							button: 0,
							bubbles: true,
							cancelable: true,
							pointerId: 1,
							pointerType: 'mouse',
						}),
					);

					const steps = 5;
					for (let i = 1; i <= steps; i++) {
						const t = i / steps;
						const mx = startX + d * t;
						const my = startY;
						window.dispatchEvent(
							new PointerEvent('pointermove', {
								clientX: mx,
								clientY: my,
								bubbles: true,
								cancelable: true,
								pointerId: 1,
								pointerType: 'mouse',
							}),
						);
					}

					window.dispatchEvent(
						new PointerEvent('pointerup', {
							clientX: finalX,
							clientY: finalY,
							bubbles: true,
							cancelable: true,
							pointerId: 1,
							pointerType: 'mouse',
						}),
					);
				},
				{taskId: TASK_ID, startX: cx, startY: cy, d: delta},
			);

			await expect
				.poll(
					async () => {
						const left = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.left || '0'));
						return left;
					},
					{message: `bar left should change after move at scale ${scale}`, timeout: 5000},
				)
				.not.toBe(leftBefore);

			const leftAfter = await bar.evaluate((el) => parseFloat((el as HTMLElement).style.left || '0'));
			const moveShift = leftAfter - leftBefore;

			// ── RESIZE leg ──
			await page.goto('/');
			await page.waitForSelector('.gantt-bar[data-task-id="1000"]');

			const bar2 = page.locator(`.gantt-bar[data-task-id="${TASK_ID}"]`);
			await expect(bar2).toBeVisible();
			const baselineWidth2 = await bar2.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));

			await page.locator('#scale-select').selectOption(scale);
			await waitForScaleChangeRender(bar2, baselineWidth2, scale);

			const [bar2Left, widthBefore] = await bar2.evaluate((el) => [
				parseFloat((el as HTMLElement).style.left || '0'),
				parseFloat((el as HTMLElement).style.width || '0'),
			]);

			const handle = bar2.locator('.gantt-resize-handle');
			await expect(handle).toBeVisible();
			await scrollEl.evaluate(
				(el, {x, margin}: {x: number; margin: number}) => {
					el.scrollLeft = Math.max(0, x - margin);
				},
				{x: bar2Left + widthBefore - 8, margin: SCROLL_MARGIN},
			);
			const hbox = await waitForBoundingBox(handle, `Handle for ${TASK_ID} not visible at scale ${scale}`);
			const hx = hbox.x + hbox.width / 2;
			const hy = hbox.y + hbox.height / 2;

			await page.evaluate(
				({taskId, startX, startY, d}: {taskId: number; startX: number; startY: number; d: number}) => {
					const el = document.querySelector(`.gantt-bar[data-task-id="${taskId}"]`);
					if (!el) {
						return;
					}
					const handleEl = el.querySelector('.gantt-resize-handle');
					if (!handleEl) {
						return;
					}

					handleEl.dispatchEvent(
						new PointerEvent('pointerdown', {
							clientX: startX,
							clientY: startY,
							button: 0,
							bubbles: true,
							cancelable: true,
							pointerId: 2,
							pointerType: 'mouse',
						}),
					);

					const steps = 5;
					for (let i = 1; i <= steps; i++) {
						const t = i / steps;
						const mx = startX + d * t;
						const my = startY;
						window.dispatchEvent(
							new PointerEvent('pointermove', {
								clientX: mx,
								clientY: my,
								bubbles: true,
								cancelable: true,
								pointerId: 2,
								pointerType: 'mouse',
							}),
						);
					}

					window.dispatchEvent(
						new PointerEvent('pointerup', {
							clientX: startX + d,
							clientY: startY,
							bubbles: true,
							cancelable: true,
							pointerId: 2,
							pointerType: 'mouse',
						}),
					);
				},
				{taskId: TASK_ID, startX: hx, startY: hy, d: delta},
			);

			await expect
				.poll(
					async () => {
						const w = await bar2.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));
						return w;
					},
					{message: `bar width should change after resize at scale ${scale}`, timeout: 5000},
				)
				.not.toBe(widthBefore);

			const widthAfter = await bar2.evaluate((el) => parseFloat((el as HTMLElement).style.width || '0'));
			const resizeShift = widthAfter - widthBefore;

			expect(resizeShift, `scale=${scale}: resizeShift=${resizeShift}, moveShift=${moveShift}`).toBeCloseTo(moveShift, 1);
		}
		// oxlint-enable eslint/no-await-in-loop
	});
});
