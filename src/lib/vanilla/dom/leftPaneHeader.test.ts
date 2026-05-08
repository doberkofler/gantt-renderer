import {describe, expect, it, vi} from 'vitest';
import {buildLeftPaneHeader, setupColumnResize, COLUMN_RESIZE_MIN_WIDTH} from './leftPane.ts';
import {type GridColumn, DEFAULT_GRID_COLUMNS} from './gridColumns.ts';

describe('buildLeftPaneHeader', () => {
	it('renders header cells from default schema', () => {
		const header = buildLeftPaneHeader(DEFAULT_GRID_COLUMNS);
		const cells = [...header.querySelectorAll('span')];

		expect(cells).toHaveLength(4);
		expect(cells[0]?.textContent).toBe('Task name');
		expect(cells[1]?.textContent).toBe('Start time');
		expect(cells[2]?.textContent).toBe('Duration');
		expect(cells[3]?.textContent).toBe('');
	});

	it('uses gridTemplateColumns matching the column schema', () => {
		const header = buildLeftPaneHeader(DEFAULT_GRID_COLUMNS);
		expect(header.style.gridTemplateColumns).toBe('1fr 90px 68px 28px');
	});

	it('renders custom columns with correct header labels', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Task name', width: '2fr'},
			{id: 'percentComplete', header: 'Progress', width: '80px', align: 'right', field: 'percentComplete'},
			{id: 'actions', header: '', width: '28px'},
		];
		const header = buildLeftPaneHeader(cols);
		const cells = [...header.querySelectorAll('span')];

		expect(cells).toHaveLength(3);
		expect(header.style.gridTemplateColumns).toBe('2fr 80px 28px');
		expect(cells[0]?.textContent).toBe('Task name');
		expect(cells[1]?.textContent).toBe('Progress');
		expect(cells[2]?.textContent).toBe('');
	});

	it('applies alignment to header cells', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Task name', width: '1fr'},
			{id: 'durationHours', header: 'Duration', width: '68px', align: 'right'},
		];
		const header = buildLeftPaneHeader(cols);
		const cells = [...header.querySelectorAll('span')];

		expect(cells[0]?.style.textAlign).toBe('');
		expect(cells[1]?.style.textAlign).toBe('right');
	});

	it('skips hidden columns in header', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Task name', width: '1fr'},
			{id: 'startDate', header: 'Start time', width: '90px', visible: false},
			{id: 'durationHours', header: 'Duration', width: '68px'},
		];
		const header = buildLeftPaneHeader(cols);
		const cells = [...header.querySelectorAll('span')];

		expect(cells).toHaveLength(2);
		expect(header.style.gridTemplateColumns).toBe('1fr 68px');
		expect(cells[0]?.textContent).toBe('Task name');
		expect(cells[1]?.textContent).toBe('Duration');
	});
});

describe('buildLeftPaneHeader resize handles', () => {
	it('includes resize handles on all but the last visible column', () => {
		const header = buildLeftPaneHeader(DEFAULT_GRID_COLUMNS);
		const handles = header.querySelectorAll('.gantt-col-resize-handle');
		expect(handles).toHaveLength(3); // 4 columns → 3 handles
	});

	it('resize handle has col-resize cursor', () => {
		const header = buildLeftPaneHeader(DEFAULT_GRID_COLUMNS);
		const handle = header.querySelector('.gantt-col-resize-handle');
		expect(handle).not.toBeNull();
		if (!(handle instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		expect(handle.style.cursor).toBe('col-resize');
	});

	it('wraps each header cell in a positioned container', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'durationHours', header: 'Days', width: '60px'},
		];
		const header = buildLeftPaneHeader(cols);
		const wrappers = [...header.children] as HTMLElement[];
		expect(wrappers).toHaveLength(2);
		// First wrapper has span + handle
		expect(wrappers[0]?.querySelector('span')?.textContent).toBe('Name');
		expect(wrappers[0]?.querySelector('.gantt-col-resize-handle')).not.toBeNull();
		// Last column: no handle
		expect(wrappers[1]?.querySelector('span')?.textContent).toBe('Days');
		expect(wrappers[1]?.querySelector('.gantt-col-resize-handle')).toBeNull();
	});
});

describe('setupColumnResize', () => {
	it('column_resize_min_width equals 30', () => {
		expect(COLUMN_RESIZE_MIN_WIDTH).toBe(30);
	});

	it('sets up pointer event listeners on resize handles', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const columns: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
			{id: 'durationHours', header: 'Days', width: '68px', field: 'durationHours'},
		];
		const header = buildLeftPaneHeader(columns);
		container.append(header);

		const bodyEl = document.createElement('div');
		container.append(bodyEl);

		const onChange = vi.fn<(c: GridColumn[]) => void>();
		const cleanup = setupColumnResize(header, bodyEl, columns, onChange);

		// Three columns → should have 2 resize handles
		const handles = header.querySelectorAll<HTMLElement>('.gantt-col-resize-handle');
		expect(handles).toHaveLength(2);

		cleanup();
		document.body.removeChild(container);
	});

	it('fires onChange callback on drag-end with updated column widths', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const columns: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
			{id: 'durationHours', header: 'Days', width: '68px', field: 'durationHours'},
		];
		const header = buildLeftPaneHeader(columns);
		container.append(header);

		const bodyEl = document.createElement('div');
		container.append(bodyEl);

		const onChange = vi.fn<(c: GridColumn[]) => void>();
		setupColumnResize(header, bodyEl, columns, onChange);

		const handle = header.querySelector('.gantt-col-resize-handle');
		expect(handle).not.toBeNull();

		handle?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 10}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 120, pointerId: 10}));
		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 10}));

		expect(onChange).toHaveBeenCalledWith(expect.any(Array));
		const updated = onChange.mock.calls[0]?.[0];
		expect(updated).toBeDefined();
		expect(updated).toHaveLength(3);
		// All columns should have px widths after resize
		for (const col of updated ?? []) {
			expect(col.width).toMatch(/^\d+px$/u);
		}

		document.body.removeChild(container);
	});

	it('updates gridTemplateColumns on header and body rows during drag', () => {
		const container = document.createElement('div');
		document.body.append(container);

		const columns: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'durationHours', header: 'Days', width: '68px', field: 'durationHours'},
		];
		const header = buildLeftPaneHeader(columns);
		container.append(header);

		const bodyEl = document.createElement('div');
		// Add a mock body row
		const row = document.createElement('div');
		row.setAttribute('role', 'row');
		row.style.gridTemplateColumns = '1fr 68px';
		bodyEl.append(row);
		container.append(bodyEl);

		setupColumnResize(header, bodyEl, columns);

		const handle2 = header.querySelector('.gantt-col-resize-handle');
		handle2?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, pointerId: 10}));
		window.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: 120, pointerId: 10}));

		// Both header and body row should have updated gridTemplateColumns
		expect(header.style.gridTemplateColumns).toMatch(/^\d+px \d+px$/u);
		expect(row.style.gridTemplateColumns).toBe(header.style.gridTemplateColumns);

		window.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 10}));
		document.body.removeChild(container);
	});
});
