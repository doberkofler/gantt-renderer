import {type GanttInput, type SpecialDay, type Task, type Link} from '../validation/schemas.ts';
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

export type OnTaskClick = (payload: {task: Task; instance: GanttInstance}) => void | Promise<void>;
export type OnTaskMove = (payload: {task: Task; newStartDate: Date; instance: GanttInstance}) => boolean | Promise<boolean>;
export type OnTaskResize = (payload: {task: Task; newDurationHours: number; instance: GanttInstance}) => boolean | Promise<boolean>;
export type OnTaskAdd = (payload: {parentTask: Task; instance: GanttInstance}) => boolean | Promise<boolean>;
export type OnTaskDoubleClick = (payload: {task: Task; instance: GanttInstance}) => void | Promise<void>;
export type OnLinkCreate = (payload: {type: 'FS'; sourceTask: Task; targetTask: Task; instance: GanttInstance}) => boolean | Promise<boolean>;
export type OnLinkClick = (payload: {link: Link; instance: GanttInstance}) => void | Promise<void>;
export type OnLinkDblClick = (payload: {link: Link; instance: GanttInstance}) => void | Promise<void>;
export type OnProgressChange = (payload: {task: Task; newPercentComplete: number; instance: GanttInstance}) => boolean | Promise<boolean>;

export type GanttCallbacks = {
	onTaskClick?: OnTaskClick;
	onTaskMove?: OnTaskMove;
	onTaskResize?: OnTaskResize;
	onTaskAdd?: OnTaskAdd;
	onTaskDoubleClick?: OnTaskDoubleClick;
	onLinkCreate?: OnLinkCreate;
	onLinkClick?: OnLinkClick;
	onLinkDblClick?: OnLinkDblClick;
	onProgressChange?: OnProgressChange;
	onLeftPaneWidthChange?: (payload: {width: number; instance: GanttInstance}) => void | Promise<void>;
	onGridColumnsChange?: (payload: {columns: GridColumn[]; instance: GanttInstance}) => void | Promise<void>;
};

type InternalCallbacks = {
	onTaskClick?: (id: number) => void;
	onTaskMove?: (payload: {id: number; startDate: Date}) => void;
	_onTaskMoveFinal?: (payload: {id: number; startDate: Date}) => Promise<boolean>;
	onTaskResize?: (payload: {id: number; durationHours: number}) => void;
	_onTaskResizeFinal?: (payload: {id: number; durationHours: number}) => Promise<boolean>;
	onTaskAdd?: (parentId: number) => void;
	onTaskEditIntent?: (payload: {id: number; source: 'grid' | 'bar' | 'milestone'; trigger: 'doubleClick'; task: Task}) => void;
	onTaskDoubleClick?: (payload: {id: number; task: Task}) => void;
	onLinkCreate?: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void;
	onLinkClick?: (payload: {id: number; source: number; target: number; type: string}) => void;
	onLinkDblClick?: (payload: {id: number; source: number; target: number; type: string}) => void;
	onTaskProgressDrag?: (payload: {id: number; percentComplete: number}) => void;
	_onTaskProgressDragFinal?: (payload: {id: number; percentComplete: number}) => Promise<boolean>;
	onLeftPaneWidthChange?: (width: number) => void;
	onGridColumnsChange?: (columns: GridColumn[]) => void;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type GanttOptions = {
	scale?: TimeScale;
	highlightLinkedDependenciesOnSelect?: boolean;
	linkCreationEnabled?: boolean;
	progressDragEnabled?: boolean;
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
};

export type GanttInstance = {
	update: (input: GanttInput) => void;
	setOptions: (opts: Partial<GanttOptions>) => void;
	setCallbacks: (cbs: GanttCallbacks) => void;
	select: (id: number | null, fireCallback?: boolean) => void;
	collapseAll: () => void;
	expandAll: () => void;
	destroy: () => void;
};

const HEADER_H = 52;
const OVERSCAN = 4;

/**
 * Progressive-enhancement Gantt chart component.
 * Validates input, builds a DOM tree, and renders a full interactive chart
 * inside the given container element.
 *
 * @example
 * ```ts
 * const chart = new GanttChart(document.getElementById('chart')!, input, {
 *   locale: 'de-DE',
 *   theme: 'dark',
 * });
 * ```
 */
export class GanttChart implements GanttInstance {
	readonly #container: HTMLElement;
	readonly #opts: GanttOptions;
	#callbacks: GanttCallbacks;
	#input: GanttInput | null = null;
	#scale: TimeScale;
	#selectedId: number | null = null;
	#scrollTop = 0;
	#rafPending = false;
	#rafId: number | null = null;
	#destroyed = false;
	readonly #dragOriginals = new Map<number, Task>();
	#taskIndex: Map<number, number>;
	#lastGridClick: {id: number; atMs: number} | null = null;
	#userSplitWidth: number | null = null;

	#height: number;
	#locale: ChartLocale;
	#timelineMinWidth: number;
	#columns: GridColumn[];
	#leftPaneDefaultWidth: number;
	#weekendDays: Set<number>;
	#specialDaysByDate: Map<string, ResolvedSpecialDay>;
	#expandedIds: Set<number>;

	// oxlint-disable typescript-eslint(prefer-readonly)
	#root!: HTMLElement;
	#scrollEl!: HTMLElement;
	#leftPane!: HTMLElement;
	#leftHeader!: HTMLElement;
	#leftBody!: HTMLElement;
	#rightPane!: HTMLElement;
	#rightHeader!: HTMLElement;
	#rightPaneRefs!: RightPaneRefs;
	#cbs: InternalCallbacks;

	#resizeObserver: ResizeObserver | null = null;
	#columnResizeCleanup!: () => void;

	/**
	 * Constructs a new chart, builds the DOM, and wires internal event handling.
	 * Data must be loaded via {@link update} before the chart renders.
	 * Callbacks must be set via {@link setCallbacks} before user interactions are handled.
	 *
	 * @param container - The host `HTMLElement` the chart will be appended to.
	 * @param opts - Configuration options.
	 */
	public constructor(container: HTMLElement, opts: GanttOptions = {}) {
		this.#container = container;

		this.#scale = opts.scale ?? 'day';
		this.#opts = opts;
		this.#callbacks = {};
		this.#taskIndex = new Map();
		this.#locale = resolveChartLocale(opts.locale);
		this.#columns = opts.gridColumns ?? gridColumnDefaults(this.#locale);
		this.#leftPaneDefaultWidth = opts.leftPaneWidth ?? gridNaturalWidth(this.#columns);
		this.#height = opts.height ?? 500;
		this.#timelineMinWidth = opts.timelineMinWidth ?? TIMELINE_MIN_WIDTH;
		this.#weekendDays = normalizeWeekendDays(opts.weekendDays ?? this.#locale.weekendDays);
		this.#specialDaysByDate = buildSpecialDayIndex(opts.specialDays ?? []);
		this.#expandedIds = new Set();

		this.#cbs = this.#buildCallbackAdapter();

		this.#buildDom();
		this.#wireEvents();

		container.append(this.#root);

		this.#applyTheme();

		this.#applyResponsivePaneStyles();
		this.#setupResizeObserver();
	}

	#buildCallbackAdapter(this: GanttChart): InternalCallbacks {
		return {
			onTaskClick: (id): void => {
				if (this.#selectedId === id) {
					return;
				}
				this.#selectedId = id;
				if (this.#selectedId !== null) {
					const task = this.#findTask(this.#selectedId);
					if (task !== undefined) {
						void this.#callbacks.onTaskClick?.({task, instance: this});
					}
				}
				this.#scheduleRender();
			},
			onTaskDoubleClick: (payload): void => {
				void this.#callbacks.onTaskDoubleClick?.({task: payload.task, instance: this});
			},
			onTaskEditIntent: (payload): void => {
				void this.#callbacks.onTaskDoubleClick?.({task: payload.task, instance: this});
			},
			onTaskMove: (payload): void => {
				if (!this.#dragOriginals.has(payload.id)) {
					const task = this.#input?.tasks.find((t) => t.id === payload.id);
					if (task !== undefined) {
						this.#dragOriginals.set(payload.id, task);
					}
				}
				const iso = payload.startDate.toISOString().slice(0, 10);
				this.#patchTask(payload.id, {startDate: iso});
				this.#scheduleRender();
			},
			_onTaskMoveFinal: async (payload): Promise<boolean> => {
				const task = this.#findTask(payload.id);
				if (task !== undefined) {
					const result = this.#callbacks.onTaskMove?.({task, newStartDate: payload.startDate, instance: this});
					if (result instanceof Promise) {
						if (!(await result)) {
							const original = this.#dragOriginals.get(payload.id);
							if (original !== undefined) {
								this.#patchTask(payload.id, {startDate: original.startDate});
							}
						}
					} else if (!result) {
						const original = this.#dragOriginals.get(payload.id);
						if (original !== undefined) {
							this.#patchTask(payload.id, {startDate: original.startDate});
						}
					}
				}
				this.#dragOriginals.clear();
				this.#scheduleRender();
				return true;
			},
			onTaskResize: (payload): void => {
				if (!this.#dragOriginals.has(payload.id)) {
					const task = this.#input?.tasks.find((t) => t.id === payload.id);
					if (task !== undefined) {
						this.#dragOriginals.set(payload.id, task);
					}
				}
				this.#patchTask(payload.id, {durationHours: payload.durationHours});
				this.#scheduleRender();
			},
			_onTaskResizeFinal: async (payload): Promise<boolean> => {
				const task = this.#findTask(payload.id);
				if (task !== undefined) {
					const result = this.#callbacks.onTaskResize?.({task, newDurationHours: payload.durationHours, instance: this});
					if (result instanceof Promise) {
						if (!(await result)) {
							const original = this.#dragOriginals.get(payload.id);
							if (original !== undefined && original.kind !== 'milestone') {
								this.#patchTask(payload.id, {durationHours: original.durationHours});
							}
						}
					} else if (!result) {
						const original = this.#dragOriginals.get(payload.id);
						if (original !== undefined && original.kind !== 'milestone') {
							this.#patchTask(payload.id, {durationHours: original.durationHours});
						}
					}
				}
				this.#dragOriginals.clear();
				this.#scheduleRender();
				return true;
			},
			onTaskProgressDrag: (payload): void => {
				if (!this.#dragOriginals.has(payload.id)) {
					const task = this.#input?.tasks.find((t) => t.id === payload.id);
					if (task !== undefined) {
						this.#dragOriginals.set(payload.id, task);
					}
				}
				this.#patchTask(payload.id, {percentComplete: payload.percentComplete});
				this.#scheduleRender();
			},
			_onTaskProgressDragFinal: async (payload): Promise<boolean> => {
				const task = this.#findTask(payload.id);
				if (task !== undefined) {
					const result = this.#callbacks.onProgressChange?.({task, newPercentComplete: payload.percentComplete, instance: this});
					if (result instanceof Promise) {
						if (!(await result)) {
							const original = this.#dragOriginals.get(payload.id);
							if (original !== undefined && original.kind !== 'milestone') {
								this.#patchTask(payload.id, {percentComplete: original.percentComplete});
							}
						}
					} else if (!result) {
						const original = this.#dragOriginals.get(payload.id);
						if (original !== undefined && original.kind !== 'milestone') {
							this.#patchTask(payload.id, {percentComplete: original.percentComplete});
						}
					}
				}
				this.#dragOriginals.clear();
				this.#scheduleRender();
				return true;
			},
			onTaskAdd: (parentId): void => {
				const parentTask = this.#findTask(parentId);
				if (parentTask !== undefined) {
					void this.#callbacks.onTaskAdd?.({parentTask, instance: this});
				}
			},
			onLeftPaneWidthChange: (width): void => {
				void this.#callbacks.onLeftPaneWidthChange?.({width, instance: this});
			},
			onGridColumnsChange: (updatedColumns): void => {
				void this.#callbacks.onGridColumnsChange?.({columns: updatedColumns, instance: this});
			},
			onLinkCreate: (payload): void => {
				const sourceTask = this.#findTask(payload.sourceTaskId);
				const targetTask = this.#findTask(payload.targetTaskId);
				if (sourceTask !== undefined && targetTask !== undefined) {
					void this.#callbacks.onLinkCreate?.({type: 'FS', sourceTask, targetTask, instance: this});
				}
			},
			onLinkClick: (payload): void => {
				void this.#callbacks.onLinkClick?.({link: payload as Link, instance: this});
			},
			onLinkDblClick: (payload): void => {
				void this.#callbacks.onLinkDblClick?.({link: payload as Link, instance: this});
			},
		};
	}

	/**
	 * Sets or replaces the chart's user-facing callbacks.
	 * Does not trigger a re-render.
	 *
	 * @param cbs - The {@link GanttCallbacks} to register.
	 * @throws {GanttError} When the instance has been destroyed.
	 */
	public setCallbacks(cbs: GanttCallbacks): void {
		this.#assertAlive();
		this.#callbacks = cbs;
		this.#cbs = this.#buildCallbackAdapter();
	}

	/**
	 * Replaces the full dataset and re-renders.
	 *
	 * @param newInput - The new {@link GanttInput} to apply.
	 * @throws {GanttError} When the instance has been destroyed.
	 */
	public update(newInput: GanttInput): void {
		this.#assertAlive();
		validateLinkRefs(newInput.tasks, newInput.links);
		detectCycles(newInput.tasks, newInput.links);
		this.#input = structuredClone(newInput);
		this.#taskIndex = buildTaskIndex(this.#input.tasks);
		this.#expandedIds = getInitialExpandedIds(this.#input.tasks);
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	/**
	 * Merges the supplied options into the current configuration and re-renders
	 * only the panes affected by the changed options.
	 *
	 * @param opts - A partial {@link GanttOptions} object. Only the keys present
	 *               in this parameter are updated; missing keys keep their
	 *               previous values.
	 * @throws {GanttError} When the instance has been destroyed.
	 */
	public setOptions(opts: Partial<GanttOptions>): void {
		this.#assertAlive();

		Object.assign(this.#opts, opts);

		this.#scale = this.#opts.scale ?? 'day';

		let columnsChanged = false;

		if (opts.locale !== undefined) {
			this.#locale = resolveChartLocale(opts.locale);
			if (this.#opts.gridColumns === undefined) {
				this.#columns = gridColumnDefaults(this.#locale);
				this.#leftPaneDefaultWidth = gridNaturalWidth(this.#columns);
				columnsChanged = true;
			}
			if (this.#opts.weekendDays === undefined) {
				this.#weekendDays = normalizeWeekendDays(this.#locale.weekendDays);
			}
		}

		if (opts.gridColumns !== undefined) {
			this.#columns = opts.gridColumns;
			this.#leftPaneDefaultWidth = this.#opts.leftPaneWidth ?? gridNaturalWidth(this.#columns);
			columnsChanged = true;
		}

		if (columnsChanged && this.#input !== null) {
			this.#rebuildLeftPaneHeader();
		}

		if (opts.leftPaneWidth !== undefined) {
			this.#leftPaneDefaultWidth = opts.leftPaneWidth;
		}

		if (opts.height !== undefined) {
			this.#height = opts.height;
			this.#root.style.height = `${this.#height}px`;
		}

		if (opts.timelineMinWidth !== undefined) {
			this.#timelineMinWidth = opts.timelineMinWidth;
			this.#rightPane.style.minWidth = `${this.#timelineMinWidth}px`;
		}

		if (opts.weekendDays !== undefined) {
			this.#weekendDays = normalizeWeekendDays(opts.weekendDays);
		}

		if (opts.specialDays !== undefined) {
			this.#specialDaysByDate = buildSpecialDayIndex(opts.specialDays);
		}

		if (opts.theme !== undefined) {
			this.#applyTheme();
		}

		const hasLayoutChange =
			opts.leftPaneWidth !== undefined ||
			opts.responsiveSplitPane !== undefined ||
			opts.mobileBreakpoint !== undefined ||
			opts.mobileLeftPaneMinWidth !== undefined ||
			opts.mobileLeftPaneMaxRatio !== undefined ||
			opts.timelineMinWidth !== undefined;

		if (hasLayoutChange) {
			this.#applyResponsivePaneStyles();
		}

		const hasLeftPaneChange = columnsChanged || opts.locale !== undefined;

		const hasRightPaneChange =
			opts.scale !== undefined ||
			opts.showWeekends !== undefined ||
			opts.weekendDays !== undefined ||
			opts.specialDays !== undefined ||
			opts.highlightLinkedDependenciesOnSelect !== undefined ||
			opts.linkCreationEnabled !== undefined ||
			opts.progressDragEnabled !== undefined ||
			opts.viewportStart !== undefined ||
			opts.viewportEnd !== undefined ||
			opts.locale !== undefined ||
			opts.timelineMinWidth !== undefined;

		const hasVisualChange = hasLeftPaneChange || hasRightPaneChange || hasLayoutChange;

		if (!hasVisualChange) {
			return;
		}

		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}

		if (hasLeftPaneChange && !hasRightPaneChange) {
			this.#renderGrid();
		} else if (!hasLeftPaneChange && hasRightPaneChange) {
			this.#renderTimeline();
		} else {
			this.#render();
		}
	}

	/**
	 * Programmatically selects or deselects a task.
	 *
	 * @param id - The task ID to select, or `null` to clear the selection.
	 * @param fireCallback - Whether to fire the `onTaskClick` callback. Default `true`.
	 * @throws {GanttError} When the instance has been destroyed.
	 */
	public select(id: number | null, fireCallback = true): void {
		this.#assertAlive();
		if (id === null) {
			this.#selectedId = null;
		} else {
			const task = this.#input?.tasks.find((t) => t.id === id);
			if (task !== undefined && fireCallback) {
				void this.#callbacks.onTaskClick?.({task, instance: this});
			}
			this.#selectedId = id;
		}
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	/**
	 * Collapses all expandable groups in the task tree.
	 *
	 * @throws {GanttError} When the instance has been destroyed.
	 */
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

	/**
	 * Expands all expandable groups in the task tree.
	 *
	 * @throws {GanttError} When the instance has been destroyed.
	 */
	public expandAll(): void {
		this.#assertAlive();
		this.#expandedIds.clear();
		if (this.#input !== null) {
			for (const id of getExpandableTaskIds(this.#input.tasks)) {
				this.#expandedIds.add(id);
			}
		}
		if (this.#rafPending && this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
			this.#rafPending = false;
		}
		this.#render();
	}

	/**
	 * Removes the chart DOM and internal listeners, rendering the instance
	 * unusable. Subsequent calls to any public method will throw.
	 */
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
		for (const {cleanupDrag, cleanupLinkHandles, cleanupProgressDrag} of this.#rightPaneRefs.barRegistry.values()) {
			cleanupDrag();
			cleanupLinkHandles?.();
			cleanupProgressDrag?.();
		}
		clearChildren(this.#container);
	}

	#patchTask(id: number, patch: Partial<GanttInput['tasks'][number]>): void {
		if (this.#input === null) {
			return;
		}
		const index = this.#taskIndex.get(id);
		if (index === undefined) {
			return;
		}
		const target = this.#input.tasks[index];
		if (target === undefined) {
			return;
		}
		this.#input.tasks[index] = {...target, ...patch} as Task;
	}

	#findTask(id: number): Task | undefined {
		return this.#input?.tasks.find((t) => t.id === id);
	}

	readonly #handleGridClick = (payload: {id: number; task: Task}): void => {
		const now = Date.now();
		const prev = this.#lastGridClick;
		if (prev !== null && prev.id === payload.id && now - prev.atMs <= 350) {
			this.#lastGridClick = null;
			this.#cbs.onTaskDoubleClick?.({id: payload.id, task: payload.task});
			return;
		}
		this.#lastGridClick = {id: payload.id, atMs: now};
		this.#cbs.onTaskClick?.(payload.id);
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

	#computeState(input: GanttInput): GanttState {
		const roots = buildTaskTree(input.tasks);
		const allRows = flattenTree(roots, this.#expandedIds);
		const [vpStart, vpEnd] =
			this.#opts.viewportStart !== undefined && this.#opts.viewportEnd !== undefined
				? [this.#opts.viewportStart, this.#opts.viewportEnd]
				: deriveViewport(allRows, 48);

		const mapper = createPixelMapper(this.#scale, vpStart);
		const totalWidth = Math.ceil(mapper.toX(vpEnd)) + 1;
		const layouts = computeLayout(allRows, mapper);
		const links = routeLinks(input.links, layouts);

		const containerH = this.#height - HEADER_H;
		const rowCount = allRows.length;
		const startIndex = Math.max(0, Math.floor(this.#scrollTop / ROW_HEIGHT) - OVERSCAN);
		const endIndex = Math.min(rowCount - 1, Math.ceil((this.#scrollTop + containerH) / ROW_HEIGHT) + OVERSCAN - 1);
		const paddingTop = startIndex * ROW_HEIGHT;
		const paddingBottom = Math.max(0, (rowCount - 1 - endIndex) * ROW_HEIGHT);

		return {
			input,
			scale: this.#scale,
			highlightLinkedDependenciesOnSelect: this.#opts.highlightLinkedDependenciesOnSelect ?? false,
			linkCreationEnabled: this.#opts.linkCreationEnabled ?? false,
			progressDragEnabled: this.#opts.progressDragEnabled ?? false,
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
		const input = this.#input;
		if (input === null) {
			return;
		}
		const state = this.#computeState(input);

		renderTimeHeader(this.#rightHeader, state);
		this.#renderGridInternal(state);
		renderRightPane(this.#rightPaneRefs, state, this.#cbs);
	};

	readonly #renderGrid = (): void => {
		this.#rafPending = false;
		const input = this.#input;
		if (input === null) {
			return;
		}
		this.#renderGridInternal(this.#computeState(input));
	};

	#renderGridInternal(state: GanttState): void {
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
				onTaskClick: (id) => this.#cbs.onTaskClick?.(id),
				onRowClick: (payload) => {
					this.#handleGridClick(payload);
				},
				onTaskDoubleClick: (payload) => this.#cbs.onTaskDoubleClick?.(payload),
				onTaskAdd: (id) => this.#cbs.onTaskAdd?.(id),
			},
			this.#columns,
		);
	}

	readonly #renderTimeline = (): void => {
		this.#rafPending = false;
		const input = this.#input;
		if (input === null) {
			return;
		}
		const state = this.#computeState(input);

		renderTimeHeader(this.#rightHeader, state);
		renderRightPane(this.#rightPaneRefs, state, this.#cbs);
	};

	#rebuildLeftPaneHeader(): void {
		this.#columnResizeCleanup();
		clearChildren(this.#leftHeader);
		const headerEl = buildLeftPaneHeader(this.#columns);
		this.#leftHeader.append(headerEl);
		this.#columnResizeCleanup = setupColumnResize(headerEl, this.#leftBody, this.#columns, (updated) => {
			this.#cbs.onGridColumnsChange?.(updated);
		});
	}

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
		this.#leftHeader = leftHeader;

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
			this.#selectedId = null;
			this.#scheduleRender();
		});

		this.#root.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && this.#selectedId !== null) {
				event.preventDefault();
				this.#selectedId = null;
				this.#scheduleRender();
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
