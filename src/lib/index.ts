// ─── Core types ───────────────────────────────────────────────────────────────

export type {
	Task,
	TaskLeaf,
	TaskProject,
	TaskMilestone,
	Link,
	GanttInput,
	GanttInputRaw,
	TaskKind,
	LinkType,
	SpecialDayKind,
	SpecialDay,
} from './validation/schemas.ts';
export type {TimeScale, ScaleConfig} from './timeline/scale.ts';
export type {TaskNode} from './domain/tree.ts';
export type {BarLayout} from './timeline/layoutEngine.ts';
export type {PixelMapper} from './timeline/pixelMapper.ts';
export type {ChartLocale, LocaleLabelKey} from './locale.ts';

// ─── Validation ───────────────────────────────────────────────────────────────

export {
	GanttInputSchema,
	TaskSchema,
	LinkSchema,
	LinkTypeSchema,
	TaskKindSchema,
	SpecialDayKindSchema,
	SpecialDaySchema,
	parseGanttInput,
} from './validation/schemas.ts';

// ─── Domain ───────────────────────────────────────────────────────────────────

export {buildTaskTree, flattenTree, isParent} from './domain/tree.ts';
export {detectCycles, validateLinkRefs} from './domain/dependencies.ts';
export {parseDate, addDays, diffDays, addHours, diffHours} from './domain/dateMath.ts';

// ─── Timeline ─────────────────────────────────────────────────────────────────

export {SCALE_CONFIGS} from './timeline/scale.ts';
export {createPixelMapper} from './timeline/pixelMapper.ts';
export {computeLayout, deriveViewport, DENSITY, ROW_HEIGHT, BAR_HEIGHT, BAR_Y_OFFSET, MILESTONE_SIZE, MILESTONE_HALF} from './timeline/layoutEngine.ts';
export {routeLinks} from './rendering/linkRouter.ts';
export type {RoutedLink, Point} from './rendering/linkRouter.ts';

// ─── Locale ───────────────────────────────────────────────────────────────────

export {
	CHART_LOCALE_EN_US,
	EN_US_LABELS,
	resolveChartLocale,
	deriveWeekStartsOn,
	deriveWeekNumbering,
	deriveWeekendDays,
	formatWeekNumber,
	formatLabel,
} from './locale.ts';

// ─── Vanilla adapter ──────────────────────────────────────────────────────────

export {GanttChart} from './vanilla/gantt-chart.ts';
export type {GanttInstance, GanttOptions, GanttCallbacks, ThemeMode} from './vanilla/gantt-chart.ts';
export type {OnTaskSelect, OnTaskMove, OnTaskResize, OnTaskAdd, OnTaskDoubleClick, OnLinkCreate, OnLinkClick, OnLinkDblClick} from './vanilla/gantt-chart.ts';
export type {GridColumn} from './vanilla/dom/gridColumns.ts';
export {
	DEFAULT_GRID_COLUMNS,
	gridColumnDefaults,
	gridTemplateColumns,
	visibleColumns,
	gridNaturalWidth,
	GRID_COLUMN_FR_MIN_WIDTH,
} from './vanilla/dom/gridColumns.ts';
export type {TaskDataField} from './vanilla/dom/gridColumns.ts';
export {GanttError} from './errors.ts';
export type {GanttErrorCode} from './errors.ts';
