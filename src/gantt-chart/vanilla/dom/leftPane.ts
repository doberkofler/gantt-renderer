import {el, clearChildren, css} from './helpers.ts';
import {type GanttState} from '../state.ts';
import {type TaskNode} from '../../domain/tree.ts';
import {type Task} from '../../validation/schemas.ts';
import {isParent} from '../../domain/tree.ts';
import {ROW_HEIGHT} from '../../timeline/layoutEngine.ts';
import {type GridColumn, gridTemplateColumns, visibleColumns} from './gridColumns.ts';
import {type ChartLocale, EN_US_LABELS} from '../../locale.ts';

const INDENT = 16;
const COLUMN_MIN_WIDTH = 30;

export type LeftPaneCallbacks = {
	onToggle: (id: number) => void;
	onSelect: (id: number) => void;
	onRowClick: (payload: {id: number; task: Task}) => void;
	onTaskEditIntent: (payload: {id: number; source: 'grid'; trigger: 'doubleClick'; task: Task}) => void;
	onAdd: (id: number) => void;
};

function toTask(row: TaskNode): Task {
	return {
		id: row.id,
		text: row.text,
		startDate: row.startDate,
		durationHours: row.durationHours,
		progress: row.progress,
		type: row.type,
		open: row.open,
		...(row.parent === undefined ? {} : {parent: row.parent}),
		...(row.color === undefined ? {} : {color: row.color}),
	};
}

function buildTreeNameCell(row: TaskNode, expandedIds: Set<number>, cbs: LeftPaneCallbacks): HTMLElement {
	const hasChildren = isParent(row);
	const expanded = expandedIds.has(row.id);

	const cell = el('div');
	css(cell, {
		display: 'flex',
		alignItems: 'center',
		paddingLeft: `${row.depth * INDENT}px`,
		gap: '4px',
		overflow: 'hidden',
	});

	if (hasChildren) {
		const btn = el('button');
		btn.className = 'gantt-toggle';
		btn.textContent = expanded ? '▾' : '▸';
		css(btn, {
			width: '16px',
			height: '16px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			background: 'none',
			border: 'none',
			cursor: 'pointer',
			color: 'var(--gantt-text-secondary)',
			padding: '0',
			flexShrink: '0',
		});
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			cbs.onToggle(row.id);
		});
		cell.append(btn);
	} else {
		const spacer = el('span');
		spacer.style.width = '16px';
		spacer.style.flexShrink = '0';
		cell.append(spacer);
	}

	const label = el('span');
	css(label, {
		fontSize: 'var(--gantt-font-size-md)',
		fontWeight: row.type === 'project' ? 'var(--gantt-font-weight-bold)' : 'var(--gantt-font-weight-normal)',
		color: 'var(--gantt-text)',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	});
	label.textContent = row.text;
	cell.append(label);

	return cell;
}

function buildDataCell(row: TaskNode, column: GridColumn, locale: ChartLocale): HTMLElement {
	const cell = el('span');
	const styles: Partial<CSSStyleDeclaration> = {
		fontSize: 'var(--gantt-font-size-sm)',
		color: 'var(--gantt-text-secondary)',
		paddingRight: '8px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	};
	if (column.align !== undefined) {
		styles.textAlign = column.align;
	}
	css(cell, styles);

	const task = toTask(row);
	if (column.field !== undefined) {
		const rawValue = task[column.field];
		if (column.format !== undefined) {
			cell.textContent = column.format(rawValue, task, row, locale);
		} else {
			cell.textContent = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
		}
	}

	return cell;
}

function buildAddButton(row: TaskNode, cbs: LeftPaneCallbacks, locale: ChartLocale): HTMLElement {
	const btn = el('button');
	btn.className = 'gantt-add-btn';
	btn.textContent = '+';
	btn.title = locale.labels?.addSubtaskTitle ?? EN_US_LABELS.addSubtaskTitle;
	css(btn, {
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		color: 'var(--gantt-text-secondary)',
		fontSize: 'var(--gantt-font-size-lg)',
		lineHeight: '1',
	});
	btn.addEventListener('click', (event) => {
		event.stopPropagation();
		cbs.onAdd(row.id);
	});

	return btn;
}

function buildCell(column: GridColumn, row: TaskNode, expandedIds: Set<number>, cbs: LeftPaneCallbacks, locale: ChartLocale): HTMLElement {
	switch (column.id) {
		case 'name': {
			return buildTreeNameCell(row, expandedIds, cbs);
		}
		case 'actions': {
			return buildAddButton(row, cbs, locale);
		}
		default: {
			return buildDataCell(row, column, locale);
		}
	}
}

function buildRow(
	row: TaskNode,
	selectedId: number | null,
	expandedIds: Set<number>,
	cbs: LeftPaneCallbacks,
	columns: GridColumn[],
	locale: ChartLocale,
): HTMLElement {
	const selected = row.id === selectedId;

	const wrapper = el('div');
	wrapper.className = 'gantt-row';
	css(wrapper, {
		display: 'grid',
		gridTemplateColumns: gridTemplateColumns(columns),
		height: `${ROW_HEIGHT}px`,
		alignItems: 'center',
		paddingLeft: '8px',
		background: selected ? 'var(--gantt-row-selected)' : 'var(--gantt-bg)',
		borderBottom: '1px solid var(--gantt-border)',
		cursor: 'default',
		boxSizing: 'border-box',
	});
	wrapper.tabIndex = 0;
	wrapper.setAttribute('role', 'row');
	wrapper.setAttribute('aria-selected', String(selected));
	wrapper.dataset['taskId'] = String(row.id);
	wrapper.addEventListener('click', () => {
		const task = toTask(row);
		cbs.onRowClick({id: row.id, task});
	});
	wrapper.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			cbs.onSelect(row.id);
		}
	});

	for (const column of visibleColumns(columns)) {
		wrapper.append(buildCell(column, row, expandedIds, cbs, locale));
	}

	return wrapper;
}

/**
 * Renders the left grid pane.
 *
 * @param container - The left pane body element to render into.
 * @param state - The current chart state.
 * @param cbs - The left pane callbacks.
 * @param columns - The grid column schema.
 */
export function renderLeftPane(container: HTMLElement, state: GanttState, cbs: LeftPaneCallbacks, columns: GridColumn[]): void {
	const {allRows, selectedId, expandedIds, startIndex, endIndex, paddingTop, paddingBottom, locale} = state;

	const frag = document.createDocumentFragment();

	if (paddingTop > 0) {
		const spacer = el('div');
		spacer.style.height = `${paddingTop}px`;
		frag.append(spacer);
	}

	for (const row of allRows.slice(startIndex, endIndex + 1)) {
		frag.append(buildRow(row, selectedId, expandedIds, cbs, columns, locale));
	}

	if (paddingBottom > 0) {
		const spacer = el('div');
		spacer.style.height = `${paddingBottom}px`;
		frag.append(spacer);
	}

	clearChildren(container);
	container.append(frag);
}

/**
 * Builds the header row for the left pane.
 *
 * @param columns - The grid column schema.
 * @returns The header DOM element.
 */
export function buildLeftPaneHeader(columns: GridColumn[]): HTMLElement {
	const header = el('div');
	css(header, {
		display: 'grid',
		gridTemplateColumns: gridTemplateColumns(columns),
		height: '52px',
		background: 'var(--gantt-header-bg)',
		borderBottom: '1px solid var(--gantt-border)',
		paddingLeft: '8px',
		alignItems: 'flex-end',
		paddingBottom: '4px',
		boxSizing: 'border-box',
	});

	const visible = visibleColumns(columns);
	for (let i = 0; i < visible.length; i++) {
		const column = visible[i];
		if (column === undefined) {
			continue;
		}
		const wrapper = el('div');
		css(wrapper, {position: 'relative', display: 'flex', alignItems: 'flex-end'});

		const cell = el('span');
		css(cell, {
			fontSize: 'var(--gantt-font-size-xs)',
			fontWeight: 'var(--gantt-font-weight-bold)',
			color: 'var(--gantt-text-secondary)',
			letterSpacing: 'var(--gantt-letter-spacing-wide)',
			textTransform: 'uppercase',
			paddingRight: '8px',
		});
		if (column.align !== undefined) {
			cell.style.textAlign = column.align;
		}
		cell.textContent = column.header;
		wrapper.append(cell);

		if (i < visible.length - 1) {
			const handle = el('div');
			handle.className = 'gantt-col-resize-handle';
			css(handle, {
				position: 'absolute',
				right: '-3px',
				top: '0',
				bottom: '0',
				width: '6px',
				cursor: 'col-resize',
				zIndex: '1',
			});
			wrapper.append(handle);
		}

		header.append(wrapper);
	}

	return header;
}

export const COLUMN_RESIZE_MIN_WIDTH = COLUMN_MIN_WIDTH;

/**
 * Wires up column resize interactions on header handles.
 * Must be called after the header is in the DOM (so `getBoundingClientRect` works).
 *
 * @param headerEl - The header element containing resize handles.
 * @param bodyEl - The body element whose rows share the column widths.
 * @param columns - The grid column schema (mutated in place on resize end).
 * @param onChange - Optional callback fired on drag end with updated columns.
 * @returns A cleanup function that removes all resize listeners.
 */
export function setupColumnResize(headerEl: HTMLElement, bodyEl: HTMLElement, columns: GridColumn[], onChange?: (columns: GridColumn[]) => void): () => void {
	const handles = headerEl.querySelectorAll<HTMLElement>('.gantt-col-resize-handle');
	const cleanups: (() => void)[] = [];

	for (let colIndex = 0; colIndex < handles.length; colIndex++) {
		const handle = handles.item(colIndex);
		if (handle === null) {
			continue;
		}
		const capturedColIndex = colIndex;

		const onPointerDown = (e: PointerEvent): void => {
			if (e.button !== 0) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();

			const startX = e.clientX;
			const cells = [...headerEl.children] as HTMLElement[];
			const startWidths = cells.map((c) => c.getBoundingClientRect().width);

			const onMove = (me: PointerEvent): void => {
				const dx = me.clientX - startX;
				const newWidths = [...startWidths];

				newWidths[capturedColIndex] = Math.max(COLUMN_MIN_WIDTH, (startWidths[capturedColIndex] ?? 0) + dx);

				if (capturedColIndex + 1 < newWidths.length) {
					newWidths[capturedColIndex + 1] = Math.max(COLUMN_MIN_WIDTH, (startWidths[capturedColIndex + 1] ?? 0) - dx);
				}

				const template = newWidths.map((w) => `${Math.round(w)}px`).join(' ');
				headerEl.style.gridTemplateColumns = template;

				const rows = bodyEl.querySelectorAll<HTMLElement>('[role="row"]');
				for (const row of rows) {
					row.style.gridTemplateColumns = template;
				}
			};

			const onUp = (): void => {
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);

				const finalCells = [...headerEl.children] as HTMLElement[];
				const visible = visibleColumns(columns);
				for (let i = 0; i < visible.length && i < finalCells.length; i++) {
					const col = visible[i];
					const cell = finalCells[i];
					if (col !== undefined && cell !== undefined) {
						const w = cell.getBoundingClientRect().width;
						col.width = `${Math.round(w)}px`;
					}
				}
				onChange?.([...columns]);
			};

			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
		};

		handle.addEventListener('pointerdown', onPointerDown);
		cleanups.push(() => {
			handle.removeEventListener('pointerdown', onPointerDown);
		});
	}

	return () => {
		for (const cleanup of cleanups) {
			cleanup();
		}
	};
}
