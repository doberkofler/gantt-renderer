import {el, css, clearChildren} from './helpers.ts';
import {createDependencyLayer, updateDependencyLayer, hideGhostLine} from './dependencyLayer.ts';
import {attachDrag, attachMilestoneClick, bindMilestoneTask, attachProgressDrag, toTask} from '../interaction/drag.ts';
import {attachLinkEndpointHandle, createEndpointHandle} from '../interaction/linkCreation.ts';
import {type GanttState} from '../state.ts';
import {type TaskNode} from '../../domain/tree.ts';
import {type BarLayout} from '../../timeline/layoutEngine.ts';
import {ROW_HEIGHT, MILESTONE_HALF, totalContentHeight} from '../../timeline/layoutEngine.ts';
import {nextScaleBoundary, snapToScaleBoundary} from '../../timeline/scale.ts';
import {startOfDay} from '../../domain/dateMath.ts';
import {type ChartLocale, EN_US_LABELS, formatLabel} from '../../locale.ts';
import {type Task} from '../../validation/schemas.ts';

type RightPaneCallbacks = {
	onTaskClick?: (id: number) => void;
	onTaskMove?: (payload: {id: number; startDate: Date}) => void;
	onTaskResize?: (payload: {id: number; durationHours: number}) => void;
	onTaskEditIntent?: (payload: {id: number; source: 'grid' | 'bar' | 'milestone'; trigger: 'doubleClick'; task: Task}) => void;
	onTaskDoubleClick?: (payload: {id: number; task: Task}) => void;
	onLinkCreate?: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void;
	onLinkClick?: (payload: {id: number; source: number; target: number; type: string}) => void;
	onLinkDblClick?: (payload: {id: number; source: number; target: number; type: string}) => void;
	_onTaskMoveFinal?: (payload: {id: number; startDate: Date}) => Promise<boolean>;
	_onTaskResizeFinal?: (payload: {id: number; durationHours: number}) => Promise<boolean>;
	onTaskProgressDrag?: (payload: {id: number; percentComplete: number}) => void;
	_onTaskProgressDragFinal?: (payload: {id: number; percentComplete: number}) => Promise<boolean>;
	onTooltipText?: (payload: {id: number; task: Task}) => string | null;
};

const BAR_COLOR: Record<string, string> = {
	task: 'var(--gantt-task)',
	project: 'var(--gantt-project)',
	milestone: 'var(--gantt-milestone)',
};

/**
 * Persistent DOM references for the right pane.
 * Created once in mount.ts; updated cheaply on each render.
 */
export type RightPaneRefs = {
	scrollContainer: HTMLElement;
	stripeContainer: HTMLElement;
	absoluteLayer: HTMLElement;
	svgLayer: SVGSVGElement;
	tooltipEl: HTMLElement;
	/** Map of taskId → {bar, resizeHandle, cleanupDrag} for update-in-place */
	barRegistry: Map<
		number,
		{
			bar: HTMLElement;
			resizeHandle: HTMLElement;
			cleanupDrag?: () => void;
			cleanupLinkHandles?: () => void;
			cleanupProgressDrag?: () => void;
			cleanupTooltip?: () => void;
		}
	>;
};

/**
 * Creates the skeleton DOM structure for the right pane. Call once.
 *
 * @returns A new {@link RightPaneRefs} with empty containers and bar registry.
 */
export function createRightPaneRefs(): RightPaneRefs {
	const scrollContainer = el('div');
	const stripeContainer = el('div');
	const absoluteLayer = el('div');
	const svgLayer = createDependencyLayer(0, 0);

	css(stripeContainer, {position: 'relative'});
	css(absoluteLayer, {position: 'absolute', top: '52px', left: '0'});

	scrollContainer.append(stripeContainer);
	scrollContainer.append(absoluteLayer);
	absoluteLayer.append(svgLayer);

	const tooltipEl = el('div');
	tooltipEl.className = 'gantt-tooltip';
	tooltipEl.style.display = 'none';
	scrollContainer.append(tooltipEl);

	return {
		scrollContainer,
		stripeContainer,
		absoluteLayer,
		svgLayer,
		tooltipEl,
		barRegistry: new Map(),
	};
}

function ariaLabel(locale: ChartLocale, key: 'ariaTask' | 'ariaMilestone', arg: string): string {
	const template = locale.labels?.[key] ?? EN_US_LABELS[key];
	return formatLabel(template, arg);
}

function renderSpecialDayBackgrounds(layer: HTMLElement, beforeNode: Element, state: GanttState, contentHeight: number): void {
	const {mapper, viewportStart, viewportEnd, showWeekends, weekendDays, specialDaysByDate} = state;
	let cur = startOfDay(viewportStart);

	while (cur < viewportEnd) {
		const next = new Date(cur.getTime() + 86_400_000);
		const x = mapper.toX(cur);
		const width = Math.max(1, mapper.toX(next) - x);
		const dateKey = cur.toISOString().slice(0, 10);
		const specialDay = specialDaysByDate.get(dateKey);
		const isWeekend = weekendDays.has(cur.getUTCDay());

		let kind: 'weekend' | 'holiday' | 'custom' | null = null;
		if (specialDay !== undefined) {
			const {kind: specialKind} = specialDay;
			kind = specialKind;
		} else if (showWeekends && isWeekend) {
			kind = 'weekend';
		}

		if (kind !== null) {
			const dayCell = el('div');
			dayCell.className = `gantt-day-cell gantt-day-cell--${kind}`;
			if (specialDay?.className !== undefined) {
				dayCell.classList.add(specialDay.className);
			}
			dayCell.dataset['date'] = dateKey;
			if (specialDay?.label !== undefined) {
				dayCell.dataset['label'] = specialDay.label;
				dayCell.title = specialDay.label;
			}
			css(dayCell, {
				position: 'absolute',
				left: `${x}px`,
				top: '0',
				width: `${width}px`,
				height: `${contentHeight}px`,
				pointerEvents: 'none',
				zIndex: '1',
			});
			layer.insertBefore(dayCell, beforeNode);
		}

		cur = next;
	}
}

// ─── Bar ─────────────────────────────────────────────────────────────────────

function renderBar(
	layer: HTMLElement,
	svgLayer: SVGSVGElement,
	task: TaskNode,
	layout: BarLayout,
	selectedId: number | null,
	registry: RightPaneRefs['barRegistry'],
	state: GanttState,
	cbs: RightPaneCallbacks,
	tooltipEl: HTMLElement,
): void {
	const selected = task.id === selectedId;
	const readonly = task.readonly === true;
	const color = BAR_COLOR[layout.kind] ?? BAR_COLOR['task'];

	const bar = el('div');
	bar.className = `gantt-bar${selected ? ' gantt-bar--selected gantt-shape--selected' : ''}`;
	css(bar, {
		position: 'absolute',
		left: `${layout.x}px`,
		top: `${layout.y}px`,
		width: `${layout.width}px`,
		height: `${layout.height}px`,
		...(color === undefined ? {} : {background: color}),
		borderRadius: layout.kind === 'project' ? '3px' : '4px',
		cursor: readonly ? 'pointer' : 'grab',
		userSelect: 'none',
		overflow: 'hidden',
		zIndex: selected ? '3' : '2',
		touchAction: 'none',
	});

	// Progress overlay
	let cleanupProgressDrag: (() => void) | undefined;
	if (layout.progressWidth > 0) {
		const prog = el('div');
		const progressEnabled = state.progressDragEnabled;
		css(prog, {
			position: 'absolute',
			left: '0',
			top: '0',
			width: `${layout.progressWidth}px`,
			height: '100%',
			background: 'rgba(0,0,0,0.18)',
			...(progressEnabled ? {cursor: 'ew-resize', touchAction: 'none'} : {pointerEvents: 'none'}),
		});
		if (progressEnabled) {
			prog.className = 'gantt-progress-overlay';
			cleanupProgressDrag = attachProgressDrag(prog, bar, task, () => state.mapper, cbs);
		}
		bar.append(prog);
	}

	// Label
	const label = el('span');
	css(label, {
		position: 'absolute',
		left: '8px',
		right: '8px',
		top: '50%',
		transform: 'translateY(-50%)',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		color: 'var(--gantt-bar-label-color)',
		fontSize: 'var(--gantt-font-size-sm)',
		fontWeight: 'var(--gantt-font-weight-semibold)',
		whiteSpace: 'nowrap',
		pointerEvents: 'none',
		textShadow: '0 1px 2px rgba(0,0,0,0.25)',
	});
	label.textContent = task.text;
	bar.append(label);
	bar.tabIndex = 0;
	bar.setAttribute('role', 'button');
	bar.setAttribute('aria-label', ariaLabel(state.locale, 'ariaTask', task.text));
	bar.setAttribute('aria-pressed', String(selected));
	bar.dataset['taskId'] = String(task.id);
	bar.addEventListener('click', (event) => {
		if (event.detail === 2) {
			cbs.onTaskDoubleClick?.({id: task.id, task: toTask(task)});
		} else {
			cbs.onTaskClick?.(task.id);
		}
	});
	bar.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			cbs.onTaskClick?.(task.id);
		}
	});

	let handle: HTMLElement | undefined;
	let cleanupDrag: (() => void) | undefined;

	if (!readonly) {
		// Resize handle
		handle = el('div');
		handle.className = 'gantt-resize-handle';
		css(handle, {
			position: 'absolute',
			right: '0',
			top: '0',
			width: '8px',
			height: '100%',
			cursor: 'ew-resize',
			zIndex: '1',
			touchAction: 'none',
		});
		bar.append(handle);

		layer.insertBefore(bar, svgLayer);
		cleanupDrag = attachDrag(bar, handle, task, () => state.mapper, cbs);
	} else {
		layer.insertBefore(bar, svgLayer);
	}

	// Link-creation endpoint handles
	let cleanupLinkHandles: (() => void) | undefined;
	if (state.linkCreationEnabled) {
		const barCenterY = layout.y + layout.height / 2;
		const leftHandle = createEndpointHandle();
		leftHandle.style.left = `${layout.x}px`;
		leftHandle.style.top = `${barCenterY}px`;
		layer.insertBefore(leftHandle, svgLayer);

		const rightHandle = createEndpointHandle();
		rightHandle.style.left = `${layout.x + layout.width}px`;
		rightHandle.style.top = `${barCenterY}px`;
		layer.insertBefore(rightHandle, svgLayer);

		const cleanupLeft = attachLinkEndpointHandle(leftHandle, task.id, layout.x, barCenterY, svgLayer, layer, cbs);
		const cleanupRight = attachLinkEndpointHandle(rightHandle, task.id, layout.x + layout.width, barCenterY, svgLayer, layer, cbs);

		// Show handles on bar hover
		const onBarEnter = (): void => {
			leftHandle.style.opacity = '1';
			rightHandle.style.opacity = '1';
			leftHandle.style.transform = 'translate(-50%, -50%) scale(1)';
			rightHandle.style.transform = 'translate(-50%, -50%) scale(1)';
		};
		const onBarLeave = (): void => {
			leftHandle.style.opacity = '0';
			rightHandle.style.opacity = '0';
			leftHandle.style.transform = 'translate(-50%, -50%) scale(0.8)';
			rightHandle.style.transform = 'translate(-50%, -50%) scale(0.8)';
		};
		bar.addEventListener('mouseenter', onBarEnter);
		bar.addEventListener('mouseleave', onBarLeave);

		cleanupLinkHandles = (): void => {
			cleanupLeft();
			cleanupRight();
			bar.removeEventListener('mouseenter', onBarEnter);
			bar.removeEventListener('mouseleave', onBarLeave);
		};
	}

	// Tooltip
	const onTooltipEnter = (): void => {
		const content = cbs.onTooltipText?.({id: task.id, task: toTask(task)});
		if (content && content.length > 0) {
			tooltipEl.innerHTML = content;
			tooltipEl.style.display = '';
		} else {
			tooltipEl.style.display = 'none';
		}
	};
	const onTooltipMove = (e: MouseEvent): void => {
		const offsetX = 12;
		const offsetY = -8;
		let left = e.clientX + offsetX;
		let top = e.clientY + offsetY;
		const maxLeft = window.innerWidth - tooltipEl.offsetWidth - 4;
		const maxTop = window.innerHeight - tooltipEl.offsetHeight - 4;
		left = Math.max(4, Math.min(left, maxLeft));
		top = Math.max(4, Math.min(top, maxTop));
		tooltipEl.style.left = `${left}px`;
		tooltipEl.style.top = `${top}px`;
	};
	const onTooltipLeave = (): void => {
		tooltipEl.style.display = 'none';
	};
	bar.addEventListener('mouseenter', onTooltipEnter);
	bar.addEventListener('mousemove', onTooltipMove);
	bar.addEventListener('mouseleave', onTooltipLeave);
	const cleanupTooltip = (): void => {
		bar.removeEventListener('mouseenter', onTooltipEnter);
		bar.removeEventListener('mousemove', onTooltipMove);
		bar.removeEventListener('mouseleave', onTooltipLeave);
	};

	const entry: {
		bar: HTMLElement;
		resizeHandle: HTMLElement;
		cleanupDrag?: () => void;
		cleanupLinkHandles?: () => void;
		cleanupProgressDrag?: () => void;
		cleanupTooltip?: () => void;
	} = {bar, resizeHandle: handle ?? el('div')};
	if (cleanupDrag !== undefined) {
		entry.cleanupDrag = cleanupDrag;
	}
	if (cleanupLinkHandles !== undefined) {
		entry.cleanupLinkHandles = cleanupLinkHandles;
	}
	if (cleanupProgressDrag !== undefined) {
		entry.cleanupProgressDrag = cleanupProgressDrag;
	}
	if (cleanupTooltip !== undefined) {
		entry.cleanupTooltip = cleanupTooltip;
	}
	registry.set(task.id, entry);
}

// ─── Milestone ────────────────────────────────────────────────────────────────

function renderMilestone(
	layer: HTMLElement,
	svgLayer: SVGSVGElement,
	task: TaskNode,
	layout: BarLayout,
	selectedId: number | null,
	registry: RightPaneRefs['barRegistry'],
	cbs: RightPaneCallbacks,
	state: GanttState,
	tooltipEl: HTMLElement,
): void {
	const selected = task.id === selectedId;
	const readonly = task.readonly === true;
	const size = MILESTONE_HALF * 2;

	const diamond = el('div');
	diamond.className = `gantt-milestone${selected ? ' gantt-shape--selected' : ''}`;
	css(diamond, {
		position: 'absolute',
		left: `${layout.x - MILESTONE_HALF}px`,
		top: `${layout.y + (layout.height - size) / 2}px`,
		width: `${size}px`,
		height: `${size}px`,
		background: 'var(--gantt-milestone)',
		transform: 'rotate(45deg)',
		cursor: readonly ? 'default' : 'pointer',
		zIndex: '4',
	});
	diamond.tabIndex = 0;
	diamond.setAttribute('role', 'button');
	diamond.setAttribute('aria-label', ariaLabel(state.locale, 'ariaMilestone', task.text));
	diamond.setAttribute('aria-pressed', String(selected));
	diamond.dataset['taskId'] = String(task.id);
	diamond.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			cbs.onTaskClick?.(task.id);
		}
	});
	const labelEl = el('span');
	css(labelEl, {
		position: 'absolute',
		left: '50%',
		top: '110%',
		transform: 'translate(-50%, 0) rotate(-45deg)',
		fontSize: 'var(--gantt-font-size-xs)',
		fontWeight: 'var(--gantt-font-weight-semibold)',
		color: 'var(--gantt-milestone)',
		whiteSpace: 'nowrap',
		pointerEvents: 'none',
	});
	labelEl.textContent = task.text;
	diamond.append(labelEl);

	layer.insertBefore(diamond, svgLayer);
	bindMilestoneTask(diamond, task);

	// Milestones have no resize handle — use a dummy div for the registry interface
	const dummy = el('div');
	let cleanupDrag: (() => void) | undefined;

	if (!readonly) {
		cleanupDrag = attachMilestoneClick(diamond, task.id, cbs);
	} else {
		diamond.addEventListener('click', (event) => {
			if (event.detail === 2) {
				cbs.onTaskDoubleClick?.({id: task.id, task: toTask(task)});
			} else {
				cbs.onTaskClick?.(task.id);
			}
		});
	}

	// Link-creation endpoint handle for milestones (single handle at center)
	let cleanupLinkHandles: (() => void) | undefined;
	if (state.linkCreationEnabled) {
		const diamondCenterY = layout.y + layout.height / 2;
		const linkHandle = createEndpointHandle();
		linkHandle.style.left = `${layout.x}px`;
		linkHandle.style.top = `${diamondCenterY}px`;
		linkHandle.style.background = 'var(--gantt-milestone)';
		layer.insertBefore(linkHandle, svgLayer);

		const cleanupLink = attachLinkEndpointHandle(linkHandle, task.id, layout.x, diamondCenterY, svgLayer, layer, cbs);

		const onDiamondEnter = (): void => {
			linkHandle.style.opacity = '1';
			linkHandle.style.transform = 'translate(-50%, -50%) scale(1)';
		};
		const onDiamondLeave = (): void => {
			linkHandle.style.opacity = '0';
			linkHandle.style.transform = 'translate(-50%, -50%) scale(0.8)';
		};
		diamond.addEventListener('mouseenter', onDiamondEnter);
		diamond.addEventListener('mouseleave', onDiamondLeave);

		cleanupLinkHandles = (): void => {
			cleanupLink();
			diamond.removeEventListener('mouseenter', onDiamondEnter);
			diamond.removeEventListener('mouseleave', onDiamondLeave);
		};
	}

	// Tooltip
	const onTooltipEnter = (): void => {
		const content = cbs.onTooltipText?.({id: task.id, task: toTask(task)});
		if (content && content.length > 0) {
			tooltipEl.innerHTML = content;
			tooltipEl.style.display = '';
		} else {
			tooltipEl.style.display = 'none';
		}
	};
	const onTooltipMove = (e: MouseEvent): void => {
		const offsetX = 12;
		const offsetY = -8;
		let left = e.clientX + offsetX;
		let top = e.clientY + offsetY;
		const maxLeft = window.innerWidth - tooltipEl.offsetWidth - 4;
		const maxTop = window.innerHeight - tooltipEl.offsetHeight - 4;
		left = Math.max(4, Math.min(left, maxLeft));
		top = Math.max(4, Math.min(top, maxTop));
		tooltipEl.style.left = `${left}px`;
		tooltipEl.style.top = `${top}px`;
	};
	const onTooltipLeave = (): void => {
		tooltipEl.style.display = 'none';
	};
	diamond.addEventListener('mouseenter', onTooltipEnter);
	diamond.addEventListener('mousemove', onTooltipMove);
	diamond.addEventListener('mouseleave', onTooltipLeave);
	const cleanupTooltip = (): void => {
		diamond.removeEventListener('mouseenter', onTooltipEnter);
		diamond.removeEventListener('mousemove', onTooltipMove);
		diamond.removeEventListener('mouseleave', onTooltipLeave);
	};

	const entry: {
		bar: HTMLElement;
		resizeHandle: HTMLElement;
		cleanupDrag?: () => void;
		cleanupLinkHandles?: () => void;
		cleanupProgressDrag?: () => void;
		cleanupTooltip?: () => void;
	} = {bar: diamond, resizeHandle: dummy};
	if (cleanupDrag !== undefined) {
		entry.cleanupDrag = cleanupDrag;
	}
	if (cleanupLinkHandles !== undefined) {
		entry.cleanupLinkHandles = cleanupLinkHandles;
	}
	if (cleanupTooltip !== undefined) {
		entry.cleanupTooltip = cleanupTooltip;
	}
	registry.set(task.id, entry);
}

/**
 * Full render of the right pane.
 * Grid lines and stripes are rebuilt each call (cheap — no event listeners).
 * Bars are rebuilt each call with fresh drag listeners (old ones cleaned up first).
 *
 * @param refs - The right pane DOM references.
 * @param state - The current chart state.
 * @param cbs - The chart callbacks.
 */
export function renderRightPane(refs: RightPaneRefs, state: GanttState, cbs: RightPaneCallbacks): void {
	const {
		allRows,
		layouts,
		links,
		mapper,
		scale,
		viewportStart,
		viewportEnd,
		totalWidth,
		selectedId,
		highlightLinkedDependenciesOnSelect,
		paddingTop,
		paddingBottom,
		startIndex,
	} = state;

	const {stripeContainer, absoluteLayer, svgLayer, barRegistry} = refs;
	const rowCount = allRows.length;
	const contentHeight = totalContentHeight(rowCount);

	// ── Stripe rows (virtual slice only) ───────────────────────────────────
	const visibleRows = allRows.slice(state.startIndex, state.endIndex + 1);
	clearChildren(stripeContainer);
	css(stripeContainer, {width: `${totalWidth}px`});

	// Top spacer
	if (paddingTop > 0) {
		const s = el('div');
		s.style.height = `${paddingTop}px`;
		stripeContainer.append(s);
	}

	for (let i = 0; i < visibleRows.length; i++) {
		const rowIdx = startIndex + i;
		const stripe = el('div');
		css(stripe, {
			height: `${ROW_HEIGHT}px`,
			background: rowIdx % 2 === 0 ? 'var(--gantt-bg)' : 'var(--gantt-stripe)',
			borderBottom: '1px solid var(--gantt-border)',
		});
		stripeContainer.append(stripe);
	}

	// Bottom spacer
	if (paddingBottom > 0) {
		const s = el('div');
		s.style.height = `${paddingBottom}px`;
		stripeContainer.append(s);
	}

	// ── Absolute layer: grid lines + today + bars ──────────────────────────
	css(absoluteLayer, {width: `${totalWidth}px`, height: `${contentHeight}px`});

	// Remove all children except svgLayer (last child)
	const toRemove: Element[] = [];
	for (const child of [...absoluteLayer.children]) {
		if (child !== svgLayer) {
			toRemove.push(child);
		}
	}
	for (const node of toRemove) {
		absoluteLayer.removeChild(node);
	}

	// Clean up orphaned ghost line from interrupted drags
	hideGhostLine(svgLayer);

	// Clean up previous drag listeners
	for (const {cleanupDrag, cleanupLinkHandles, cleanupProgressDrag} of barRegistry.values()) {
		cleanupDrag?.();
		cleanupLinkHandles?.();
		cleanupProgressDrag?.();
	}
	barRegistry.clear();

	// Special day backgrounds (day scale only)
	if (scale === 'day') {
		renderSpecialDayBackgrounds(absoluteLayer, svgLayer, state, contentHeight);
	}

	// Grid lines
	let gridCur = snapToScaleBoundary(viewportStart, scale);
	while (gridCur <= viewportEnd) {
		const x = mapper.toX(gridCur);
		const line = el('div');
		css(line, {
			position: 'absolute',
			left: `${x}px`,
			top: '0',
			width: '1px',
			height: `${contentHeight}px`,
			background: 'var(--gantt-grid-line)',
			pointerEvents: 'none',
		});
		absoluteLayer.insertBefore(line, svgLayer);
		gridCur = nextScaleBoundary(gridCur, scale);
	}

	// Today marker (render only when within timeline bounds)
	const todayX = mapper.toX(new Date());
	const todayLineWidth = 2;
	if (todayX >= 0 && todayX <= totalWidth - todayLineWidth) {
		const todayLine = el('div');
		todayLine.className = 'gantt-today-marker';
		css(todayLine, {
			position: 'absolute',
			left: `${todayX}px`,
			top: '0',
			width: `${todayLineWidth}px`,
			height: `${contentHeight}px`,
			background: 'var(--gantt-today)',
			pointerEvents: 'none',
			zIndex: '5',
		});
		absoluteLayer.insertBefore(todayLine, svgLayer);
	}

	const visibleTaskIds = new Set(visibleRows.map((task) => task.id));

	// Bars (virtual slice only)
	for (const task of visibleRows) {
		const layout = layouts.get(task.id);
		if (layout === undefined) {
			continue;
		}

		if (layout.kind === 'milestone') {
			renderMilestone(absoluteLayer, svgLayer, task, layout, selectedId, barRegistry, cbs, state, refs.tooltipEl);
		} else {
			renderBar(absoluteLayer, svgLayer, task, layout, selectedId, barRegistry, state, cbs, refs.tooltipEl);
		}
	}

	// SVG dependency overlay (visible rows only)
	const visibleLinks = links.filter((link) => visibleTaskIds.has(link.sourceTaskId) && visibleTaskIds.has(link.targetTaskId));
	updateDependencyLayer(svgLayer, visibleLinks, totalWidth, contentHeight, selectedId, highlightLinkedDependenciesOnSelect, cbs);
}
