import {el, clearChildren, appendAll} from './helpers.ts';
import {type GanttState} from '../state.ts';
import {nextScaleBoundary, snapToScaleBoundary} from '../../timeline/scale.ts';
import {formatHeaderLabel, formatUpperLabel} from '../../domain/dateMath.ts';

type Cell = {label: string; x: number; width: number};

/**
 * Inline style helper local to this module.
 *
 * @param elem - The target element.
 * @param styles - A partial CSS style declaration to apply.
 */
function css_(elem: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
	for (const [k, v] of Object.entries(styles)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(elem.style as any)[k] = v ?? '';
	}
}

/**
 * Fully replaces the content of `container` with two header rows.
 * Called on scale change or viewport change only — not on scroll.
 *
 * @param container - The header container element to render into.
 * @param state - The current chart state.
 */
export function renderTimeHeader(container: HTMLElement, state: GanttState): void {
	const {scale, viewportStart, viewportEnd, mapper, totalWidth, locale} = state;
	const weekStartsOn = locale.weekStartsOn ?? 1;

	const upperCells: Cell[] = [];
	const lowerCells: Cell[] = [];

	let cur = snapToScaleBoundary(viewportStart, scale, weekStartsOn);
	let prevUpperLabel = '';
	let upperStart = 0;
	let upperWidth = 0;

	while (cur < viewportEnd) {
		const next = nextScaleBoundary(cur, scale);
		const x = mapper.toX(cur);
		const w = mapper.toX(next) - x;
		lowerCells.push({label: formatHeaderLabel(cur, scale, locale), x, width: w});

		const uLabel = formatUpperLabel(cur, scale, locale);
		if (uLabel !== prevUpperLabel) {
			if (prevUpperLabel !== '') {
				upperCells.push({label: prevUpperLabel, x: upperStart, width: upperWidth});
			}
			prevUpperLabel = uLabel;
			upperStart = x;
			upperWidth = w;
		} else {
			upperWidth += w;
		}
		cur = next;
	}
	if (prevUpperLabel !== '') {
		upperCells.push({label: prevUpperLabel, x: upperStart, width: upperWidth});
	}

	// ── Upper row ──────────────────────────────────────────────────────────
	const upperRow = el('div');
	css_(upperRow, {
		position: 'relative',
		height: '24px',
		width: `${totalWidth}px`,
		background: 'var(--gantt-header-bg)',
		borderBottom: '1px solid var(--gantt-border)',
	});

	const upperNodes = upperCells.map((cell) => {
		const d = el('div');
		css_(d, {
			position: 'absolute',
			left: `${cell.x}px`,
			width: `${cell.width}px`,
			height: '100%',
			borderRight: '1px solid var(--gantt-border)',
			display: 'flex',
			alignItems: 'center',
			paddingLeft: '8px',
			fontSize: 'var(--gantt-font-size-xs)',
			fontWeight: 'var(--gantt-font-weight-bold)',
			color: 'var(--gantt-text)',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			letterSpacing: 'var(--gantt-letter-spacing-tight)',
			textTransform: 'uppercase',
		});
		d.textContent = cell.label;
		return d;
	});

	// ── Lower row ──────────────────────────────────────────────────────────
	const lowerRow = el('div');
	css_(lowerRow, {
		position: 'relative',
		height: '28px',
		width: `${totalWidth}px`,
		background: 'var(--gantt-header-bg)',
		borderBottom: '1px solid var(--gantt-border)',
	});

	const lowerNodes = lowerCells.map((cell) => {
		const d = el('div');
		css_(d, {
			position: 'absolute',
			left: `${cell.x}px`,
			width: `${cell.width}px`,
			height: '100%',
			borderRight: '1px solid var(--gantt-border)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 'var(--gantt-font-size-xs)',
			color: 'var(--gantt-text-secondary)',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
		});
		d.textContent = cell.label;
		return d;
	});

	appendAll(upperRow, upperNodes);
	appendAll(lowerRow, lowerNodes);

	clearChildren(container);
	container.append(upperRow);
	container.append(lowerRow);
}
