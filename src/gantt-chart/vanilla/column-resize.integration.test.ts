import {describe, expect, it, vi} from 'vitest';
import {type GridColumn} from './dom/gridColumns.ts';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('column resize handles (M14)', () => {
	const {mountTracked} = createMountHelpers();

	it('renders resize handles on grid column headers', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT);

		const handles = container.querySelectorAll('.gantt-col-resize-handle');
		// 4 default columns → 3 resize handles
		expect(handles).toHaveLength(3);

		const first = handles[0] as HTMLElement;
		expect(first?.style.cursor).toBe('col-resize');
	});

	it('fires onGridColumnsChange on column resize drag-end', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onColMock = vi.fn<(columns: GridColumn[]) => void>();

		mountTracked(container, INPUT, {
			gridColumns: [
				{id: 'name', header: 'Name', width: '1fr'},
				{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
				{id: 'durationHours', header: 'Dur', width: '68px', field: 'durationHours'},
			],
			onGridColumnsChange: onColMock,
		});

		const handle = container.querySelector<HTMLElement>('.gantt-col-resize-handle');
		expect(handle).not.toBeNull();

		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 60}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 120, pointerId: 60}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 60}));

		expect(onColMock).toHaveBeenCalled();
		const updated = onColMock.mock.calls[0]?.[0];
		expect(updated).toBeDefined();
		expect(updated).toHaveLength(3);
		for (const col of updated ?? []) {
			expect(col.width).toMatch(/^\d+px$/);
		}
	});

	it('updates gridTemplateColumns on header and body rows during column drag', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {
			gridColumns: [
				{id: 'name', header: 'Name', width: '1fr'},
				{id: 'durationHours', header: 'Dur', width: '68px', field: 'durationHours'},
			],
		});

		const handle = container.querySelector<HTMLElement>('.gantt-col-resize-handle');
		expect(handle).not.toBeNull();

		const headerEl = container.querySelector<HTMLElement>('[data-pane="left"] > div:first-child > div');
		const initialTemplate = headerEl?.style.gridTemplateColumns;
		expect(initialTemplate).toBe('1fr 68px');

		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 61}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 120, pointerId: 61}));

		// Header template should be updated to px values
		const afterMove = headerEl?.style.gridTemplateColumns;
		expect(afterMove).toMatch(/^\d+px \d+px$/);
		expect(afterMove).not.toBe(initialTemplate);

		// Body rows should match header
		const bodyRow = container.querySelector<HTMLElement>('[role="row"]');
		expect(bodyRow?.style.gridTemplateColumns).toBe(afterMove);

		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 61}));
	});
});
