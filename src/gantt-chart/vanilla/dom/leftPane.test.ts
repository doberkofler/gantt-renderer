import {describe, expect, it} from 'vitest';
import {renderLeftPane, buildLeftPaneHeader} from './leftPane.ts';
import {type GridColumn, DEFAULT_GRID_COLUMNS} from './gridColumns.ts';
import {mockState, mockCallbacks, taskNode, projectNode} from './leftPane.test-utils.ts';

describe('renderLeftPane', () => {
	it('renders rows with default column schema', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'My Task', startDate: '2026-02-01', duration: 8});
		const state = mockState({
			allRows: [node],
			startIndex: 0,
			endIndex: 0,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const rows = container.querySelectorAll('[role="row"]');
		expect(rows).toHaveLength(1);

		const row = rows[0] as HTMLElement;
		expect(row.style.gridTemplateColumns).toBe('1fr 90px 68px 28px');
		expect(row.children).toHaveLength(4);

		// Name cell — the label span is always the last child
		const nameCell = row.children[0] as HTMLElement;
		expect(nameCell.lastElementChild?.textContent).toBe('My Task');

		// Start date cell - formatted as MM/DD/YYYY in en-US
		const startCell = row.children[1] as HTMLElement;
		expect(startCell.tagName).toBe('SPAN');
		expect(startCell.textContent).toBe('02/01/2026');

		// Duration cell
		const durCell = row.children[2] as HTMLElement;
		expect(durCell.tagName).toBe('SPAN');
		expect(durCell.textContent).toBe('8');

		// Actions cell (add button)
		const actionsCell = row.children[3] as HTMLElement;
		expect(actionsCell.tagName).toBe('BUTTON');
		expect(actionsCell.className).toBe('gantt-add-btn');
		expect(actionsCell.textContent).toBe('+');
	});

	it('renders zero-duration as em dash in duration column', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Milestone', duration: 0, type: 'milestone'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const row = container.querySelector('[role="row"]');
		const durCell = row?.children[2];
		expect(durCell?.textContent).toBe('—');
	});

	it('renders project node with bold label and empty toggle button', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child', depth: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node, child],
			expandedIds: new Set([1]),
			startIndex: 0,
			endIndex: 1,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const rows = container.querySelectorAll('[role="row"]');
		expect(rows).toHaveLength(2);

		const projectRow = rows[0] as HTMLElement;
		const nameCell = projectRow.children[0] as HTMLElement;
		const toggle = nameCell.querySelector('.gantt-toggle');
		expect(toggle).not.toBeNull();
		expect(toggle?.textContent).toBe('▾'); // expanded
		const label = nameCell.querySelectorAll('span')[nameCell.querySelectorAll('span').length - 1];
		expect(label?.textContent).toBe('Project');
		expect(label?.style.fontWeight).toBe('var(--gantt-font-weight-bold)');
	});

	it('renders collapsed project with right-pointing toggle', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child', depth: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node],
			expandedIds: new Set(), // collapsed
			startIndex: 0,
			endIndex: 0,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const toggle = container.querySelector('.gantt-toggle');
		expect(toggle?.textContent).toBe('▸');
	});

	it('indents child rows based on depth', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child task', depth: 1, parent: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node, child],
			expandedIds: new Set([1]),
			startIndex: 0,
			endIndex: 1,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const rows = container.querySelectorAll('[role="row"]');
		const childRow = rows[1] as HTMLElement;
		const childNameCell = childRow.children[0] as HTMLElement;

		// Child should have paddingLeft for depth 1 → 16px
		expect(childNameCell.style.paddingLeft).toBe('16px');
		// Child should have spacer (not toggle) since it has no children
		expect(childNameCell.querySelector('.gantt-toggle')).toBeNull();
	});

	it('selects a row and sets selected background', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Selected Task'});
		const state = mockState({
			allRows: [node],
			selectedId: 1,
			startIndex: 0,
			endIndex: 0,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const el = container.querySelector('[role="row"]');
		expect(el).not.toBeNull();
		if (!(el instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		expect(el.style.background).toContain('var(--gantt-row-selected)');
		expect(el.getAttribute('aria-selected')).toBe('true');
	});

	it('fires onRowClick when row is clicked', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 42, text: 'Click Me'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const row = container.querySelector('[role="row"]');
		row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(cbs.onRowClick).toHaveBeenCalledWith(expect.objectContaining({id: 42, task: expect.objectContaining({id: 42})}));
	});

	it('fires onToggle when expand/collapse button is clicked', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child', depth: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node],
			expandedIds: new Set([1]),
			startIndex: 0,
			endIndex: 0,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const toggle = container.querySelector('.gantt-toggle');
		expect(toggle).not.toBeNull();
		if (!(toggle instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		toggle.click();

		expect(cbs.onToggle).toHaveBeenCalledWith(1);
		expect(cbs.onRowClick).not.toHaveBeenCalled(); // stopPropagation
	});

	it('fires onAdd when add button is clicked', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 5, text: 'Add Here'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const addBtn = container.querySelector('.gantt-add-btn');
		expect(addBtn).not.toBeNull();
		if (!(addBtn instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		addBtn.click();

		expect(cbs.onAdd).toHaveBeenCalledWith(5);
		expect(cbs.onRowClick).not.toHaveBeenCalled(); // stopPropagation
	});

	it('renders row wrapper with gantt-row CSS class', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Row Class Test'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const row = container.querySelector('[role="row"]');
		expect(row).not.toBeNull();
		expect(row?.classList.contains('gantt-row')).toBe(true);
	});

	it('renders row wrapper with gantt-row class for project and task nodes', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child', depth: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node, child],
			expandedIds: new Set([1]),
			startIndex: 0,
			endIndex: 1,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const rows = container.querySelectorAll('[role="row"]');
		expect(rows).toHaveLength(2);
		for (const row of rows) {
			expect(row.classList.contains('gantt-row')).toBe(true);
		}
	});

	it('toggle button has gantt-toggle class', () => {
		const container = document.createElement('div');
		const child = taskNode({id: 2, text: 'Child', depth: 1});
		const node = projectNode({id: 1, text: 'Project', children: [child]});
		const state = mockState({
			allRows: [node],
			expandedIds: new Set([1]),
			startIndex: 0,
			endIndex: 0,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const toggle = container.querySelector('.gantt-toggle');
		expect(toggle).not.toBeNull();
		expect(toggle?.classList.contains('gantt-toggle')).toBe(true);
	});

	it('add button has gantt-add-btn class', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 5, text: 'Button Class Test'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const addBtn = container.querySelector('.gantt-add-btn');
		expect(addBtn).not.toBeNull();
		expect(addBtn?.classList.contains('gantt-add-btn')).toBe(true);
	});

	it('renders custom column schema with different order and widths', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Custom', startDate: '2026-03-15', duration: 3, progress: 0.75});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		const customColumns: GridColumn[] = [
			{id: 'duration', header: 'Dur', width: '50px', field: 'duration'},
			{id: 'name', header: 'Name', width: '2fr'},
			{id: 'progress', header: '%', width: '60px', field: 'progress', align: 'right', format: (value) => `${Math.round((value as number) * 100)}%`},
		];

		renderLeftPane(container, state, cbs, customColumns);

		const el = container.querySelector('[role="row"]');
		expect(el).not.toBeNull();
		if (!(el instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		expect(el.style.gridTemplateColumns).toBe('50px 2fr 60px');
		expect(el.children).toHaveLength(3);

		// Duration first
		expect((el.children[0] as HTMLElement).textContent).toBe('3');
		// Name second (tree name cell — label is last child)
		const nameCell = el.children[1] as HTMLElement;
		expect(nameCell.lastElementChild?.textContent).toBe('Custom');
		// Progress third with format
		expect((el.children[2] as HTMLElement).textContent).toBe('75%');
		expect((el.children[2] as HTMLElement).style.textAlign).toBe('right');
	});

	it('custom column headers and body use same gridTemplateColumns', () => {
		const customColumns: GridColumn[] = [
			{id: 'name', header: 'Task name', width: '2fr'},
			{id: 'progress', header: 'Progress', width: '80px', field: 'progress', format: (v) => String(Math.round((v as number) * 100))},
		];

		const header = buildLeftPaneHeader(customColumns);
		expect(header.style.gridTemplateColumns).toBe('2fr 80px');

		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Test', progress: 0.5});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, customColumns);

		const el2 = container.querySelector('[role="row"]');
		expect(el2).not.toBeNull();
		if (!(el2 instanceof HTMLElement)) {
			throw new Error('Expected HTMLElement');
		}
		expect(el2.style.gridTemplateColumns).toBe('2fr 80px');
	});

	it('handles column with only id and width (no field, no format)', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Test'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		const columns: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'empty', header: 'Empty', width: '100px'},
		];

		renderLeftPane(container, state, cbs, columns);

		const row = container.querySelector('[role="row"]');
		expect(row).not.toBeNull();
		expect(row?.children).toHaveLength(2);
		// The empty column should produce an empty span
		const emptyCell = row?.children[1] as HTMLElement;
		expect(emptyCell.tagName).toBe('SPAN');
		expect(emptyCell.textContent).toBe('');
	});

	it('renders column with field but no format as raw string', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Test', duration: 7});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		const columns: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'duration', header: 'Dur', width: '50px', field: 'duration'},
		];

		renderLeftPane(container, state, cbs, columns);

		const row2 = container.querySelector('[role="row"]');
		expect(row2).not.toBeNull();
		const durCell2 = row2?.children[1] as HTMLElement;
		expect(durCell2?.textContent).toBe('7');
	});

	it('renders padding spacers for virtualized rows', () => {
		const container = document.createElement('div');
		const node = taskNode({id: 1, text: 'Test'});
		const state = mockState({
			allRows: [node],
			startIndex: 0,
			endIndex: 0,
			paddingTop: 88,
			paddingBottom: 44,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const children = [...container.children];
		expect(children).toHaveLength(3);
		expect((children[0] as HTMLElement).style.height).toBe('88px');
		expect((children[2] as HTMLElement).style.height).toBe('44px');
	});

	it('slice uses startIndex and endIndex to virtualize rows', () => {
		const container = document.createElement('div');
		const nodes = [taskNode({id: 1, text: 'Row 1'}), taskNode({id: 2, text: 'Row 2'}), taskNode({id: 3, text: 'Row 3'})];
		const state = mockState({
			allRows: nodes,
			startIndex: 1,
			endIndex: 1,
		});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		const rows = container.querySelectorAll('[role="row"]');
		expect(rows).toHaveLength(1);
		const nameCell = rows[0]?.children[0] as HTMLElement;
		expect(nameCell.lastElementChild?.textContent).toBe('Row 2');
	});

	it('clears container before appending new content', () => {
		const container = document.createElement('div');
		const existing = document.createElement('div');
		existing.textContent = 'old';
		container.append(existing);

		const node = taskNode({id: 1, text: 'New'});
		const state = mockState({allRows: [node], startIndex: 0, endIndex: 0});
		const cbs = mockCallbacks();

		renderLeftPane(container, state, cbs, DEFAULT_GRID_COLUMNS);

		expect(container.querySelectorAll('[role="row"]')).toHaveLength(1);
		expect(container.textContent).not.toContain('old');
	});
});
