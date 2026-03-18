import {type GanttInput, type SpecialDay, type Task} from '../validation/schemas.ts';
import {validateLinkRefs, detectCycles} from '../domain/dependencies.ts';
import {buildTaskTree, flattenTree} from '../domain/tree.ts';
import {createPixelMapper} from '../timeline/pixelMapper.ts';
import {computeLayout, deriveViewport, ROW_HEIGHT} from '../timeline/layoutEngine.ts';
import {routeLinks} from '../rendering/linkRouter.ts';
import {type TimeScale} from '../timeline/scale.ts';
import {type GanttState, type ResolvedSpecialDay} from './state.ts';
import {el, css, clearChildren} from './dom/helpers.ts';
import {renderTimeHeader} from './dom/timeHeader.ts';
import {renderLeftPane, buildLeftPaneHeader, setupColumnResize} from './dom/leftPane.ts';
import {createRightPaneRefs, renderRightPane} from './dom/rightPane.ts';
import {type RightPaneRefs} from './dom/rightPane.ts';
import {type GridColumn, gridNaturalWidth, gridColumnDefaults} from './dom/gridColumns.ts';
import {GanttError} from '../errors.ts';
import {buildTaskIndex, buildSpecialDayIndex, normalizeWeekendDays, getExpandableTaskIds, getInitialExpandedIds} from './utils.ts';
import {attachSplitter} from './splitter.ts';
import {computeLeftPaneWidth, MOBILE_BREAKPOINT, MOBILE_LEFT_PANE_MIN_WIDTH, MOBILE_LEFT_PANE_MAX_RATIO, TIMELINE_MIN_WIDTH} from './responsive.ts';
import {type ChartLocale, resolveChartLocale} from '../locale.ts';

export type OnTaskSelect = (taskId: number | null) => void;
export type OnTaskMove = (payload: {id: number; startDate: Date}) => void;
export type OnTaskResize = (payload: {id: number; duration: number}) => void;
export type OnTaskAdd = (payload: {parentId: number}) => void;
export type OnTaskDoubleClick = (payload: {id: number; source: 'grid' | 'bar' | 'milestone'}) => void;
export type OnTaskEditIntent = (payload: {id: number; source: 'grid' | 'bar' | 'milestone'; trigger: 'double_click'; task: Task}) => void;
export type OnLinkCreate = (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void;

export type GanttCallbacks = {
	onSelect?: OnTaskSelect;
	onMove?: OnTaskMove;
	onResize?: OnTaskResize;
	onAdd?: OnTaskAdd;
	onTaskDoubleClick?: OnTaskDoubleClick;
	onTaskEditIntent?: OnTaskEditIntent;
	onLinkCreate?: OnLinkCreate;
	onLeftPaneWidthChange?: (width: number) => void;
	onGridColumnsChange?: (columns: GridColumn[]) => void;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type GanttOptions = {
	scale?: TimeScale;
	highlightLinkedDependenciesOnSelect?: boolean;
	linkCreationEnabled?: boolean;
	leftPaneWidth?: number;
	responsiveSplitPane?: boolean;
	mobileBreakpoint?: number;
	mobileLeftPaneMinWidth?: number;
	mobileLeftPaneMaxRatio?: number;
	timelineMinWidth?: number;
	height?: number;
	viewportStart?: Date;
	viewportEnd?: Date;
	locale?: ChartLocale | string;
	showWeekends?: boolean;
	weekendDays?: number[];
	specialDays?: SpecialDay[];
	gridColumns?: GridColumn[];
	theme?: ThemeMode;
} & GanttCallbacks;

export type GanttInstance = {
	update: (input: GanttInput) => void;
	setScale: (scale: TimeScale) => void;
	select: (id: number | null) => void;
	collapseAll: () => void;
	expandAll: () => void;
	destroy: () => void;
};

const HEADER_H = 52;
const OVERSCAN = 4;
export class GanttChart implements GanttInstance {
	readonly #container: HTMLElement;
	readonly #opts: GanttOptions;
	#input: GanttInput;
	#scale: TimeScale;
	#selectedId: number | null = null;
	#scrollTop = 0;
	#rafPending = false;
	#rafId: number | null = null;
	#destroyed = false;
	#taskIndex: Map<number, number>;
	#lastGridClick: {id: number; atMs: number} | null = null;
	#userSplitWidth: number | null = null;

	readonly #height: number;
	readonly #locale: ChartLocale;
	readonly #timelineMinWidth: number;
	readonly #columns: GridColumn[];
	readonly #leftPaneDefaultWidth: number;
	readonly #weekendDays: Set<number>;
	readonly #specialDaysByDate: Map<string, ResolvedSpecialDay>;
	readonly #expandedIds: Set<number>;

	// oxlint-disable typescript-eslint(prefer-readonly)
	#root!: HTMLElement;
	#scrollEl!: HTMLElement;
	#leftPane!: HTMLElement;
	#leftBody!: HTMLElement;
	#rightPane!: HTMLElement;
	#rightHeader!: HTMLElement;
	#rightPaneRefs!: RightPaneRefs;
	readonly #cbs: GanttCallbacks;

	#resizeObserver: ResizeObserver | null = null;
	#columnResizeCleanup!: () => void;

	public constructor(container: HTMLElement, input: GanttInput, opts: GanttOptions = {}) {
		this.#container = container;

		validateLinkRefs(input.tasks, input.links);
		detectCycles(input.tasks, input.links);

		this.#input = input;
		this.#scale = opts.scale ?? 'day';
		this.#opts = opts;
		this.#taskIndex = buildTaskIndex(input.tasks);
		this.#locale = resolveChartLocale(opts.locale);
		this.#columns = opts.gridColumns ?? gridColumnDefaults(this.#locale);
		this.#leftPaneDefaultWidth = opts.leftPaneWidth ?? gridNaturalWidth(this.#columns);
		this.#height = opts.height ?? 500;
		this.#timelineMinWidth = opts.timelineMinWidth ?? TIMELINE_MIN_WIDTH;
		this.#weekendDays = normalizeWeekendDays(opts.weekendDays ?? this.#locale.weekendDays);
		this.#specialDaysByDate = buildSpecialDayIndex(opts.specialDays ?? []);
		this.#expandedIds = getInitialExpandedIds(input.tasks);

		this.#cbs = {
			onSelect: (id): void => {
				if (this.#selectedId === id) {
					return;
				}
				this.#selectedId = id;
				opts.onSelect?.(this.#selectedId);
				this.#scheduleRender();
			},
			onTaskDoubleClick: (payload): void => {
				opts.onTaskDoubleClick?.(payload);
			},
			onTaskEditIntent: (payload): void => {
				opts.onTaskEditIntent?.(payload);
				opts.onTaskDoubleClick?.({id: payload.id, source: payload.source});
			},
			onMove: (payload): void => {
				const iso = payload.startDate.toISOString().slice(0, 10);
				this.#patchTask(payload.id, {start_date: iso});
				opts.onMove?.(payload);
				this.#scheduleRender();
			},
			onResize: (payload): void => {
				this.#patchTask(payload.id, {duration: payload.duration});
				opts.onResize?.(payload);
				this.#scheduleRender();
			},
			onLeftPaneWidthChange: (width): void => {
				opts.onLeftPaneWidthChange?.(width);
			},
			onGridColumnsChange: (updatedColumns): void => {
				opts.onGridColumnsChange?.(updatedColumns);
			},
			onLinkCreate: (payload): void => {
				opts.onLinkCreate?.(payload);
			},
		};

		this.#buildDom();
		this.#wireEvents();

		container.append(this.#root);

		this.#applyTheme();

		this.#applyResponsivePaneStyles();
		this.#setupResizeObserver();

		this.#render();
	}

	public update(newInput: GanttInput): void {
		this.#assertAlive();
		validateLinkRefs(newInput.tasks, newInput.links);
		detectCycles(newInput.tasks, newInput.links);
		this.#input = newInput;
		this.#taskIndex = buildTaskIndex(newInput.tasks);
		this.#scheduleRender();
	}

	public setScale(scale: TimeScale): void {
		this.#assertAlive();
		this.#scale = scale;
		this.#scheduleRender();
	}

	public select(id: number | null): void {
		this.#assertAlive();
		this.#selectedId = id;
		this.#opts.onSelect?.(id);
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	public collapseAll(): void {
		this.#assertAlive();
		this.#expandedIds.clear();
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	public expandAll(): void {
		this.#assertAlive();
		this.#expandedIds.clear();
		for (const id of getExpandableTaskIds(this.#input.tasks)) {
			this.#expandedIds.add(id);
		}
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	public destroy(): void {
		if (this.#destroyed) {
			return;
		}
		this.#destroyed = true;
		this.#scrollEl.removeEventListener('scroll', this.#onScroll);
		if (this.#resizeObserver !== null) {
			this.#resizeObserver.disconnect();
		} else {
			window.removeEventListener('resize', this.#applyResponsivePaneStyles);
		}
		if (this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
		}
		this.#columnResizeCleanup();
		for (const {cleanupDrag, cleanupLinkHandles} of this.#rightPaneRefs.barRegistry.values()) {
			cleanupDrag();
			cleanupLinkHandles?.();
		}
		clearChildren(this.#container);
	}

	#patchTask(id: number, patch: Partial<GanttInput['tasks'][number]>): void {
		const index = this.#taskIndex.get(id);
		if (index === undefined) {
			return;
		}
		const target = this.#input.tasks[index];
		if (target === undefined) {
			return;
		}
		this.#input.tasks[index] = {...target, ...patch};
	}

	readonly #handleGridClick = (payload: {id: number; task: Task}): void => {
		const now = Date.now();
		const prev = this.#lastGridClick;
		if (prev !== null && prev.id === payload.id && now - prev.atMs <= 350) {
			this.#lastGridClick = null;
			this.#cbs.onTaskEditIntent?.({id: payload.id, source: 'grid', trigger: 'double_click', task: payload.task});
			return;
		}
		this.#lastGridClick = {id: payload.id, atMs: now};
		this.#cbs.onSelect?.(payload.id);
	};

	readonly #onScroll = (): void => {
		({scrollTop: this.#scrollTop} = this.#scrollEl);
		this.#scheduleRender();
	};

	readonly #applyResponsivePaneStyles = (): void => {
		const computedWidth = computeLeftPaneWidth({
			hostWidth: Math.max(0, this.#container.clientWidth),
			defaultWidth: this.#leftPaneDefaultWidth,
			userSplitWidth: this.#userSplitWidth,
			explicitOptWidth: this.#opts.leftPaneWidth,
			responsiveSplitPane: this.#opts.responsiveSplitPane ?? true,
			mobileBreakpoint: this.#opts.mobileBreakpoint ?? MOBILE_BREAKPOINT,
			mobileLeftPaneMinWidth: this.#opts.mobileLeftPaneMinWidth ?? MOBILE_LEFT_PANE_MIN_WIDTH,
			mobileLeftPaneMaxRatio: this.#opts.mobileLeftPaneMaxRatio ?? MOBILE_LEFT_PANE_MAX_RATIO,
			timelineMinWidth: this.#timelineMinWidth,
		});
		this.#leftPane.style.width = `${computedWidth}px`;
		this.#leftPane.style.minWidth = `${computedWidth}px`;
		this.#leftPane.style.maxWidth = `${computedWidth}px`;
		this.#rightPane.style.minWidth = `${this.#timelineMinWidth}px`;
	};

	#computeState(): GanttState {
		const roots = buildTaskTree(this.#input.tasks);
		const allRows = flattenTree(roots, this.#expandedIds);
		const [vpStart, vpEnd] =
			this.#opts.viewportStart !== undefined && this.#opts.viewportEnd !== undefined
				? [this.#opts.viewportStart, this.#opts.viewportEnd]
				: deriveViewport(allRows, 2);

		const mapper = createPixelMapper(this.#scale, vpStart);
		const totalWidth = Math.ceil(mapper.toX(vpEnd)) + 1;
		const layouts = computeLayout(allRows, mapper);
		const links = routeLinks(this.#input.links, layouts);

		const containerH = this.#height - HEADER_H;
		const rowCount = allRows.length;
		const startIndex = Math.max(0, Math.floor(this.#scrollTop / ROW_HEIGHT) - OVERSCAN);
		const endIndex = Math.min(rowCount - 1, Math.ceil((this.#scrollTop + containerH) / ROW_HEIGHT) + OVERSCAN - 1);
		const paddingTop = startIndex * ROW_HEIGHT;
		const paddingBottom = Math.max(0, (rowCount - 1 - endIndex) * ROW_HEIGHT);

		return {
			input: this.#input,
			scale: this.#scale,
			highlightLinkedDependenciesOnSelect: this.#opts.highlightLinkedDependenciesOnSelect ?? false,
			linkCreationEnabled: this.#opts.linkCreationEnabled ?? false,
			expandedIds: this.#expandedIds,
			selectedId: this.#selectedId,
			scrollTop: this.#scrollTop,
			allRows,
			mapper,
			viewportStart: vpStart,
			viewportEnd: vpEnd,
			totalWidth,
			layouts,
			links,
			startIndex,
			endIndex,
			paddingTop,
			paddingBottom,
			showWeekends: this.#opts.showWeekends ?? true,
			weekendDays: this.#weekendDays,
			specialDaysByDate: this.#specialDaysByDate,
			locale: this.#locale,
		};
	}

	readonly #render = (): void => {
		this.#rafPending = false;
		const state = this.#computeState();

		renderTimeHeader(this.#rightHeader, state);
		renderLeftPane(
			this.#leftBody,
			state,
			{
				onToggle: (id) => {
					if (this.#expandedIds.has(id)) {
						this.#expandedIds.delete(id);
					} else {
						this.#expandedIds.add(id);
					}
					this.#scheduleRender();
				},
				onSelect: (id) => this.#cbs.onSelect?.(id),
				onRowClick: (payload) => {
					this.#handleGridClick(payload);
				},
				onTaskEditIntent: (payload) => this.#cbs.onTaskEditIntent?.(payload),
				onAdd: (id) => this.#cbs.onAdd?.({parentId: id}),
			},
			this.#columns,
		);
		renderRightPane(this.#rightPaneRefs, state, this.#cbs);
	};

	#scheduleRender(): void {
		if (this.#rafPending || this.#destroyed) {
			return;
		}
		this.#rafPending = true;
		this.#rafId = requestAnimationFrame(this.#render);
	}

	#applyTheme(): void {
		const theme = this.#opts.theme ?? 'system';
		this.#container.dataset['theme'] = theme;
	}

	#assertAlive(): void {
		if (this.#destroyed) {
			throw new GanttError('INSTANCE_DESTROYED', 'Gantt instance was destroyed');
		}
	}

	#buildDom(): void {
		const root = el('div');
		root.className = 'gantt-root';
		css(root, {
			height: `${this.#height}px`,
			overflow: 'hidden',
			display: 'flex',
			flexDirection: 'column',
			fontFamily: 'var(--gantt-font)',
			background: 'var(--gantt-bg)',
		});
		this.#root = root;

		const scrollEl = el('div');
		css(scrollEl, {flex: '1', overflow: 'auto', position: 'relative', display: 'flex'});
		root.append(scrollEl);
		this.#scrollEl = scrollEl;

		const leftPane = el('div');
		leftPane.dataset['pane'] = 'left';
		css(leftPane, {
			width: `${this.#leftPaneDefaultWidth}px`,
			flexShrink: '0',
			position: 'sticky',
			left: '0',
			zIndex: '10',
			background: 'var(--gantt-bg)',
			borderRight: '1px solid var(--gantt-border)',
		});
		this.#leftPane = leftPane;

		const leftHeader = el('div');
		css(leftHeader, {position: 'sticky', top: '0', zIndex: '11', background: 'var(--gantt-header-bg)'});
		const headerEl = buildLeftPaneHeader(this.#columns);
		leftHeader.append(headerEl);
		leftPane.append(leftHeader);

		const leftBody = el('div');
		leftPane.append(leftBody);
		this.#leftBody = leftBody;

		this.#columnResizeCleanup = setupColumnResize(headerEl, leftBody, this.#columns, (updated) => {
			this.#cbs.onGridColumnsChange?.(updated);
		});

		scrollEl.append(leftPane);

		const rightPane = el('div');
		rightPane.dataset['pane'] = 'right';
		css(rightPane, {flexShrink: '0', position: 'relative', minWidth: `${this.#timelineMinWidth}px`});
		this.#rightPane = rightPane;

		const rightHeader = el('div');
		css(rightHeader, {position: 'sticky', top: '0', zIndex: '9', background: 'var(--gantt-header-bg)'});
		rightPane.append(rightHeader);
		this.#rightHeader = rightHeader;

		this.#rightPaneRefs = createRightPaneRefs();
		rightPane.append(this.#rightPaneRefs.scrollContainer);
		scrollEl.append(rightPane);

		const splitterHandle = el('div');
		splitterHandle.className = 'gantt-splitter-handle';
		css(splitterHandle, {
			position: 'absolute',
			right: '0',
			top: '0',
			bottom: '0',
			width: '4px',
			cursor: 'col-resize',
			zIndex: '20',
		});
		leftPane.append(splitterHandle);

		attachSplitter(splitterHandle, leftPane, this.#container, this.#timelineMinWidth, (finalWidth) => {
			this.#userSplitWidth = finalWidth;
			this.#cbs.onLeftPaneWidthChange?.(finalWidth);
		});
	}

	#wireEvents(): void {
		this.#rightPaneRefs.absoluteLayer.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			if (target.closest('.gantt-bar, .gantt-milestone, .gantt-resize-handle')) {
				return;
			}
			this.#cbs.onSelect?.(null);
		});

		this.#root.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && this.#selectedId !== null) {
				event.preventDefault();
				this.#cbs.onSelect?.(null);
			}
		});

		this.#scrollEl.addEventListener('scroll', this.#onScroll);
	}

	#setupResizeObserver(): void {
		if (typeof ResizeObserver !== 'undefined') {
			this.#resizeObserver = new ResizeObserver(() => {
				this.#applyResponsivePaneStyles();
			});
			this.#resizeObserver.observe(this.#container);
		} else {
			window.addEventListener('resize', this.#applyResponsivePaneStyles);
		}
	}
}
