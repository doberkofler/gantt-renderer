# Gantt Chart Usage Guide

This guide covers all configuration options available when constructing a `GanttChart` instance.
For a quick overview, see the [README](../README.md).

## Package API

The primary entrypoint is `src/gantt-chart/index.ts`, which exports:

- Core input and domain types (`Task`, `Link`, `GanttInput`, `TaskNode`, and related types).
- Locale types and utilities (`ChartLocale`, `LocaleLabelKey`, `resolveChartLocale`, `deriveWeekendDays`, etc.).
- Validation helpers (`parseGanttInput`, `safeParseGanttInput`, and schemas).
- Timeline/domain utilities (`computeLayout`, `createPixelMapper`, `routeLinks`, and others).
- Vanilla chart class (`GanttChart`) and instance/callback types.

## Time scale support

`TimeScale` supports all chart zoom levels:

- `hour`
- `day`
- `week`
- `month`
- `quarter`
- `year`

Timeline cadence details:

- `hour`, `day`, and `week` use fixed-duration buckets.
- `month`, `quarter`, and `year` headers/grid boundaries are aligned to true UTC calendar boundaries.
- Upper and lower timeline header rows are derived from the same boundary cadence to keep grouping and bucket labels consistent while zooming and scrolling.

## Locale / Internationalization

`GanttOptions.locale` accepts a BCP 47 language tag string or a `ChartLocale` object:

```ts
export type ChartLocale = {
  code: string;                              // BCP 47 language tag, e.g. 'en-US', 'de-DE'
  labels?: Partial<Record<LocaleLabelKey, string>>;  // optional UI string overrides
  weekStartsOn?: 0 | 1 | 6;                 // 0=Sun, 1=Mon, 6=Sat (default: derived from locale)
  weekNumbering?: 'iso' | 'us' | 'simple';  // week number scheme (default: derived from locale)
  weekendDays?: number[];                    // weekend day indices 0–6 (default: derived from locale)
};
```

When a plain string is passed, `weekStartsOn`, `weekNumbering`, and `weekendDays` are derived from
CLDR conventions using `Intl.Locale.getWeekInfo()` (with a built-in fallback mapping table for
Firefox and older runtimes).

**Example — use a German locale:**

```ts
import {GanttChart} from 'gantt-renderer';

const instance = new GanttChart(container, {
  locale: 'de-DE',
});
instance.update(input);
```

**Example — full ChartLocale object with label overrides:**

```ts
import {GanttChart, type ChartLocale} from 'gantt-renderer';

const deLocale: ChartLocale = {
  code: 'de-DE',
  weekStartsOn: 1,
  weekNumbering: 'iso',
  labels: {
    columnTaskName: 'Aufgabe',
    columnStart: 'Start',
    columnDuration: 'Dauer',
    addSubtaskTitle: 'Teilaufgabe hinzufügen',
    ariaTask: 'Aufgabe {0}',
    ariaMilestone: 'Meilenstein {0}',
  },
};

const instance = new GanttChart(container, {locale: deLocale});
instance.update(input);
```

When omitted, the default is `CHART_LOCALE_EN_US` (English labels, US week conventions).

**Label keys** (`LocaleLabelKey`):

| Key | Default (en-US) | Used for |
|---|---|---|
| `ariaTask` | `Task {0}` | Task bar `aria-label` |
| `ariaMilestone` | `Milestone {0}` | Milestone `aria-label` |
| `addSubtaskTitle` | `Add subtask` | Add-button `title` attribute |
| `columnTaskName` | `Task name` | Grid column header |
| `columnStart` | `Start time` | Grid column header |
| `columnDuration` | `Duration` | Grid column header |
| `columnQuarter` | `Q` | Quarter prefix in time header |

Aria-label templates use `{0}` as the task name placeholder. Only the keys you override in
`labels` are replaced; missing keys fall back to `EN_US_LABELS`.

**Exported locale utilities:**

```ts
import {
  CHART_LOCALE_EN_US,   // default ChartLocale
  EN_US_LABELS,         // fallback label record
  resolveChartLocale,   // ChartLocale | string → ChartLocale
  deriveWeekStartsOn,   // BCP 47 → 0|1|6
  deriveWeekNumbering,  // BCP 47 → 'iso'|'us'|'simple'
  deriveWeekendDays,    // BCP 47 → number[]
  formatWeekNumber,     // Date × scheme → number
  formatLabel,          // template × arg → string
} from 'gantt-renderer';
```

**Week numbering schemes:**

- `'iso'` — ISO 8601 (week 1 contains the first Thursday; Monday start).
- `'us'` — Week 1 contains January 1; Sunday start.
- `'simple'` — `Math.ceil(dayOfYear / 7)`.

**Weekend days** default to the locale-derived convention (e.g., Fri/Sat for `ar-SA`, Sat/Sun for `de-DE`).
The `weekendDays` option overrides the locale default for non-standard corporate calendars.

## Responsive options

`GanttOptions` includes responsive controls for narrow viewports:

- `leftPaneWidth?: number` - Explicit left grid pane width in px. When omitted, the width is derived from the grid column schema using `gridNaturalWidth()` and viewport-proportional clamping (desktop: 25%–40% of viewport; mobile: see below).
- `responsiveSplitPane?: boolean` - Enables automatic mobile adaptation (default `true`).
- `mobileBreakpoint?: number` - Viewport/container width threshold for mobile behavior (default `768`).
- `mobileLeftPaneMinWidth?: number` - Minimum left-pane width in mobile mode (default `140`).
- `mobileLeftPaneMaxRatio?: number` - Max left-pane share of viewport in mobile mode (default `0.45`).
- `timelineMinWidth?: number` - Minimum timeline pane width; if needed, horizontal scrolling is used (default `220`).

This keeps the timeline visible at narrow widths (for example `375px`) while preserving desktop behavior.
On desktop, the pane width is clamped between `viewportWidth * 0.25` and `viewportWidth * 0.4`, with the natural width computed from the active column schema as the initial value.

### `gridNaturalWidth(columns)` and `GRID_COLUMN_FR_MIN_WIDTH`

Exported from the public API alongside `DEFAULT_GRID_COLUMNS`:

- `gridNaturalWidth(columns: GridColumn[]): number` — computes the minimum natural px width from a grid column schema. Fixed `px` columns sum directly; each `fr` unit contributes `GRID_COLUMN_FR_MIN_WIDTH` px (default `120`). Hidden columns are skipped.
- `GRID_COLUMN_FR_MIN_WIDTH` — px contribution per `fr` unit used by `gridNaturalWidth` (default `120`).

## Special-day options

`GanttOptions` includes timeline day-background controls:

- `showWeekends?: boolean` - Enables Saturday/Sunday highlighting in `day` scale (default `true`).
- `weekendDays?: number[]` - Configures weekend day indices (`0=Sun ... 6=Sat`) for locale/project calendars (default `[0, 6]`).
- `specialDays?: SpecialDay[]` - Explicit date-only special days that render in the timeline background.

`SpecialDay` shape:

- `date: string` - `YYYY-MM-DD` (UTC date-only semantics).
- `kind: 'holiday' | 'custom'` - Semantic class applied to the day cell.
- `label?: string` - Optional UI label (added as `data-label` and `title`).
- `className?: string` - Optional extra CSS class for consumer theming.

Notes:

- Special-day rendering applies to `day` scale columns only.
- Date matching is deterministic across locale/timezone because date keys are normalized in UTC.

### Header special-day indicators

At `day` scale, the lower timeline header row also reflects special-day semantics via a small
colored dot in each header cell:

| Cell class | Dot color token | Meaning |
|---|---|---|
| `.gantt-header-cell--weekend` | `var(--gantt-day-weekend)` | Weekend day (subject to `showWeekends`) |
| `.gantt-header-cell--holiday` | `var(--gantt-day-holiday)` | Explicit holiday from `specialDays` |
| `.gantt-header-cell--custom` | `var(--gantt-day-custom)` | Explicit custom day from `specialDays` |

The dot is a 5px `::after` pseudo-element positioned in the top-right corner of the header cell,
preserving label readability. Header cells for labeled special days also carry `data-date`,
`data-label`, and a native `title` tooltip matching the body special-day behavior.
The indicator colors share the same CSS tokens as the day-body backgrounds and respect
dark-mode overrides. At scales coarser than `day`, no header indicators are rendered.

## Dependency-link highlight options

`GanttOptions` includes dependency-link selection highlight controls:

- `highlightLinkedDependenciesOnSelect?: boolean` - When `true`, links related to the selected task use highlight color/arrow styling. Default is `false`.

By default, task selection does not change dependency link color, arrow marker, or stroke width.

## Link-creation options

`GanttOptions` includes interactive link-creation controls for dependency links:

- `linkCreationEnabled?: boolean` - Enables per-task endpoint handles and drag-to-create-link interactions. Default is `false`.

When enabled:

- Task bars show two endpoint handles (left = start, right = finish) on hover; milestones show one center handle.
- Dragging from a handle draws a ghost line in the SVG dependency layer (dashed when no target, solid with arrow when over a valid bar).
- Releasing over a different task bar fires `GanttCallbacks.onLinkCreate` with `{sourceTaskId, targetTaskId, type: 'FS'}`.
- Releasing over the source task or empty space cancels the drag with no callback.
- Handles are keyboard-accessible with `tabindex="0"`, `role="button"`, and descriptive `aria-label`.

`GanttCallbacks` callback:

```ts
export type OnLinkCreate = (payload: {
  sourceTaskId: number;
  targetTaskId: number;
  type: 'FS';
}) => void;
```

Example — enable link creation and handle new links:

```ts
import {GanttChart, type OnLinkCreate} from 'gantt-renderer';

const onLinkCreate: OnLinkCreate = (payload) => {
  console.log('New link:', payload);
  // Add the link to your data model and call instance.update(...)
};

const instance = new GanttChart(container, {
  linkCreationEnabled: true,
  onLinkCreate,
});
instance.update(input);
```

## Theme option

`GanttOptions` includes theme/dark-mode controls:

- `theme?: 'light' | 'dark' | 'system'` — Controls the chart color scheme. The constructor sets a `data-theme` attribute on the container element. Default is `'system'`.

Mode behavior:

| `theme` value | `data-theme` attribute | Visual result |
| --- | --- | --- |
| `'system'` (default) | `system` | Respects the OS `prefers-color-scheme` media query. Light on light OS, dark on dark OS. |
| `'light'` | `light` | Always light (default design tokens, no dark overrides). |
| `'dark'` | `dark` | Always dark via `[data-theme="dark"]` CSS overrides. |

Dark-mode CSS tokens override 16 custom properties covering background, header, stripe, border, grid line, text, selection, today marker, row selection, special-day backgrounds, link color, and bar label color. The `[data-theme="dark"]` selector scopes dark overrides to the container or any ancestor with the attribute.

Example — force dark mode:

```ts
import {GanttChart} from 'gantt-renderer';

const instance = new GanttChart(container, {
  theme: 'dark',
});
instance.update(input);
```

Consumers can also set `data-theme="dark"` on a parent element (e.g. `<html>`) to apply dark mode without passing the option.

## Selection visual style

Selected bars and milestones use a subtle emphasis style rather than a dominant outline.

- Selected timeline shapes receive `.gantt-shape--selected`.
- The default theme uses `--gantt-selection-ring` and `--gantt-selection-glow` tokens.
- Consumers can override these CSS variables/classes to tune selection emphasis without changing interaction behavior.

## Selection model

The chart uses a strict single-selection model:

- **Click a task** (grid row, bar, or milestone) to select it.
- **Click the same task again** — no-op; the selection stays on that task.
- **Click a different task** — switches selection to the new task.
- **Click empty space** in the timeline pane — deselects (clears selection).
- **Press Escape** — deselects when a task is selected.
- **`instance.select(null)`** — programmatic deselection.

The internal `onSelect` callback fires only on actual selection changes; repeated clicks on the same task do not emit duplicate events. Consumers receive `onSelect(taskId)` on select and `onSelect(null)` on deselect.

## Container framing tokens

The chart container border, radius, and shadow are controlled via CSS custom properties:

```css
:root {
  --gantt-container-border-radius: 6px;
  --gantt-container-border: 1px solid var(--gantt-border);
  --gantt-container-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

These tokens are applied by the `.gantt-root` CSS class. Consumers can override them
to customise the chart framing without touching inline styles. Container framing is
separate from internal pane dividers (which continue to use `--gantt-border`).

## Typography scale

Core chart typography is tokenised via CSS custom properties so consumers can override
sizing without patching the renderer:

```css
:root {
  --gantt-font-size-xs: 11px;   /* toolbar, time headers, milestone labels */
  --gantt-font-size-sm: 12px;   /* bar labels, grid cell values */
  --gantt-font-size-md: 13px;   /* row names */
  --gantt-font-size-lg: 16px;   /* add-button glyph */

  --gantt-font-weight-normal: 400;
  --gantt-font-weight-semibold: 600;
  --gantt-font-weight-bold: 700;

  --gantt-letter-spacing-tight: 0.04em;
  --gantt-letter-spacing-wide: 0.05em;

  /* Bar label colour — defaults to white for contrast on coloured bars.
     Override for dark themes or custom bar colour palettes. */
  --gantt-bar-label-color: #ffffff;
}
```

All inline font-size, font-weight, and letter-spacing values in chart surfaces
reference these tokens, keeping the typography scale consistent and
customisable.

## Density constants

`DENSITY` is a read-only constant object exported from the public API that defines the core chart geometry:

```ts
export const DENSITY = {
  rowHeight: 44,        // px height of each grid/timeline row
  barHeight: 28,        // px height of task bars
  milestoneSize: 20,    // px width/height of milestone diamond
} as const;
```

Derived values (`ROW_HEIGHT`, `BAR_HEIGHT`, `BAR_Y_OFFSET`, `MILESTONE_SIZE`, `MILESTONE_HALF`) are also exported.

CSS counterparts are available as custom properties for theme overrides:

```css
:root {
  --gantt-row-height: 44px;
  --gantt-bar-height: 28px;
  --gantt-milestone-size: 20px;
}
```

These tokens ensure row alignment, bar centering, and hit areas stay consistent across all rendering paths.

## Grid column schema

`GanttOptions` includes a `gridColumns` option for customising the left-pane grid:

- `gridColumns?: GridColumn[]` - Column schema array. When omitted, `gridColumnDefaults(locale)` generates a localized 4-column layout (name, start time, durationHours, actions).

`GridColumn` shape:

- `id: string` - Unique column identifier. Built-in IDs: `name` (tree name cell), `actions` (add button). All other IDs render as data columns.
- `header: string` - Column header label.
- `width: string` - CSS width value (e.g. `'90px'`, `'1fr'`, `'68px'`).
- `align?: 'left' | 'center' | 'right'` - Horizontal alignment for header and body cells.
- `visible?: boolean` - Whether the column is shown (default `true`).
- `field?: keyof Task` - Task field to read for data columns.
- `format?: (value, task, row, locale: ChartLocale) => string` - Optional formatter. Receives the raw field value plus full task/row context and locale.

`gridColumnDefaults(locale)` returns a localized schema using the locale's label overrides
with `EN_US_LABELS` fallback. The static `DEFAULT_GRID_COLUMNS` constant is also exported
for consumers that manage localization externally.

Example — custom column schema:

```ts
import {GanttChart, type GridColumn} from 'gantt-renderer';

const columns: GridColumn[] = [
  {id: 'name', header: 'Task', width: '2fr'},
  {id: 'progress', header: 'Progress', width: '70px', align: 'right', field: 'progress', format: (v) => `${Math.round((v as number) * 100)}%`},
  {id: 'start', header: 'Start', width: '90px', field: 'start'},
  {id: 'durationHours', header: 'Hours', width: '60px', field: 'durationHours'},
];

const instance = new GanttChart(container, {gridColumns: columns});
instance.update(input);
```

Notes:
- The `name` column renders the tree structure (indentation + toggle button).
- The `actions` column renders the add-subtask button.
- Columns with `visible: false` are excluded from both header and body.
- Header and body always share the same `gridTemplateColumns` derived from visible columns.

## Instance API

`new GanttChart(container, options)` returns a `GanttInstance` with these methods:

- `update(input)` - Replaces the full dataset and rerenders after validation.
- `setScale(scale)` - Switches between `hour|day|week|month|quarter|year` without remounting.
- `select(id | null)` - Programmatically selects a task id or clears selection with `null`.
- `collapseAll()` - Collapses all expandable groups in the task tree.
- `expandAll()` - Expands all expandable groups in the task tree.
- `destroy()` - Removes chart DOM and internal listeners.

`collapseAll()` and `expandAll()` are deterministic and idempotent; invoking the same method repeatedly does not change behavior beyond the first call.

## Pane and column resize hooks

`GanttCallbacks` includes two drag-end hooks for observing user-initiated resize actions:

- `onLeftPaneWidthChange?: (width: number) => void` — Fires when the user finishes dragging the vertical splitter between the grid and timeline panes. The callback receives the final left-pane width in pixels. Fires on `pointerup`, not on every pixel move.
- `onGridColumnsChange?: (columns: GridColumn[]) => void` — Fires when the user finishes dragging a column resize handle in the grid header. The callback receives the full column array with updated `.width` values (all converted to `px` strings). Fires on `pointerup`, not on every pixel move.

These hooks let consumers persist user preferences (e.g., save to `localStorage` or a backend) and restore them on the next mount via `leftPaneWidth` and `gridColumns` options.
