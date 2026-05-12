# Gantt Chart Usage Guide

This guide covers all configuration options available when constructing a `GanttChart` instance.
For a quick overview, see the [README](../README.md).

## Quick Start

```ts
import {GanttChart} from 'gantt-renderer';
import 'gantt-renderer/styles/gantt.css';

const rawData = {
	tasks: [
		{id: 1, text: 'Website Redesign', startDate: '2026-06-01', durationHours: 360, kind: 'project', open: true, percentComplete: 40},
		{id: 2, text: 'Design Phase',     startDate: '2026-06-01', durationHours: 120, parent: 1, kind: 'project', open: true, percentComplete: 90},
		{id: 3, text: 'Wireframes',       startDate: '2026-06-01', durationHours: 40,  parent: 2, kind: 'task', percentComplete: 100},
		{id: 4, text: 'Mockups',          startDate: '2026-06-05', durationHours: 56,  parent: 2, kind: 'task', percentComplete: 85},
		{id: 5, text: 'Design Sign-Off',  startDate: '2026-06-09', parent: 2, kind: 'milestone'},
		{id: 6, text: 'Development',      startDate: '2026-06-10', durationHours: 200, parent: 1, kind: 'project', open: true, percentComplete: 30},
		{id: 7, text: 'Frontend Build',   startDate: '2026-06-10', durationHours: 100, parent: 6, kind: 'task', percentComplete: 40},
		{id: 8, text: 'Backend API',      startDate: '2026-06-12', durationHours: 80,  parent: 6, kind: 'task', percentComplete: 25},
		{id: 9, text: 'Launch',           startDate: '2026-06-26', parent: 1, kind: 'milestone'},
	],
	links: [
		{id: 1, source: 3, target: 4, type: 'FS'},
		{id: 2, source: 4, target: 5, type: 'FS'},
		{id: 3, source: 5, target: 7, type: 'FS'},
		{id: 4, source: 5, target: 8, type: 'FS'},
		{id: 5, source: 7, target: 8, type: 'FF'},
		{id: 6, source: 7, target: 9, type: 'FS'},
		{id: 7, source: 8, target: 9, type: 'FS'},
	],
};

const instance = new GanttChart(document.getElementById('chart')!, {
	scale: 'day',
});
instance.update(rawData);
```

---

## Part 1 — Core Configuration & Usage

The essential API surface: how to create, drive, and interact with the chart.

### Instance API

`new GanttChart(container, options, callbacks?)` returns a `GanttInstance` with these methods:

- `update(input)` — Replaces the full dataset, validates link references and cycles, and re-renders.
- `setOptions(opts)` — Merges a partial `GanttOptions` into the current configuration and re-renders only the affected panes. Only properties present in `opts` are updated; missing keys keep their previous values. Left-pane-only changes (e.g. `gridColumns`) skip timeline rendering, right-pane-only changes (e.g. `scale`, `showWeekends`) skip grid rendering.
- `select(id | null)` — Programmatically selects a task id or clears selection with `null`. Fires the `onTaskSelect` callback when the selection actually changes.
- `collapseAll()` — Collapses all expandable groups in the task tree. Idempotent.
- `expandAll()` — Expands all expandable groups in the task tree. Idempotent.
- `destroy()` — Removes chart DOM and internal listeners. Subsequent calls to any public method throw.

### GanttOptions Reference

All constructor options with their types, defaults, and descriptions.

#### Structural options

| Option | Type | Default | Description |
|---|---|---|---|
| `scale` | `TimeScale` | `'day'` | Time scale for the timeline. One of `hour`, `day`, `week`, `month`, `quarter`, `year`. |
| `height` | `number` | `500` | Overall chart height in pixels. |
| `viewportStart` | `Date` | (earliest task) | Left boundary of the initial viewport. |
| `viewportEnd` | `Date` | (latest task) | Right boundary of the initial viewport. |
| `locale` | `ChartLocale \| string` | `'en-US'` | Locale for labels and calendar conventions. Accepts a BCP 47 string or a `ChartLocale` object. |
| `gridColumns` | `GridColumn[]` | (localized 3-col) | Left-pane column schema. When omitted, generates a localized layout (name, start, actions). |
| `leftPaneWidth` | `number` | (computed) | Explicit left grid pane width in px. When omitted, derived from the column schema and viewport. |
| `responsiveSplitPane` | `boolean` | `true` | Enables automatic mobile adaptation. |
| `mobileBreakpoint` | `number` | `768` | Container width in px below which mobile behavior activates. |
| `mobileLeftPaneMinWidth` | `number` | `140` | Minimum left-pane width in mobile mode. |
| `mobileLeftPaneMaxRatio` | `number` | `0.45` | Maximum left-pane share of container width in mobile mode. |
| `timelineMinWidth` | `number` | `220` | Minimum timeline pane width; horizontal scrolling if needed. |
| `theme` | `ThemeMode` | `'system'` | Color scheme: `'light'`, `'dark'`, or `'system'` (follows OS preference). |
| `showWeekends` | `boolean` | `true` | Enables weekend highlighting in `day` scale. |
| `weekendDays` | `number[]` | (from locale) | Weekend day indices (`0`=Sun … `6`=Sat). Overrides the locale-derived default. |
| `specialDays` | `SpecialDay[]` | `[]` | Explicit date-only special days rendered in the timeline background. |
| `highlightLinkedDependenciesOnSelect` | `boolean` | `false` | When `true`, links connected to the selected task use highlight styling. |
| `linkCreationEnabled` | `boolean` | `false` | Enables per-task endpoint handles and drag-to-create-link interactions. |
| `progressDragEnabled` | `boolean` | `false` | Enables dragging the percent-complete fill inside a task bar to change `percentComplete`. |
| `showAddTaskButton` | `boolean` | `true` | Shows the add-subtask button (`+`) in the actions column. Set to `false` to hide it.

#### Callback options

All callbacks are optional. See [GanttCallbacks Reference](#ganttcallbacks-reference) for signatures and details.

| Callback | Fires when… |
|---|---|
| `onTaskSelect` | A task is selected or deselected. |
| `onTaskMove` | A task bar is dragged to a new position on the timeline (once on release). |
| `onTaskResize` | A task bar's resize handle is dragged to change its duration (once on release). |
| `onProgressChange` | A task bar's progress fill is dragged to change its percent complete (once on release). |
| `onTaskAdd` | The add-subtask button in the actions column is clicked. |
| `onTaskDoubleClick` | A task is double-clicked (grid row, task bar, or milestone). |
| `onLinkCreate` | A dependency link drag completes over a valid target task. |
| `onLinkClick` | A dependency link is clicked in the timeline. |
| `onLinkDblClick` | A dependency link is double-clicked in the timeline. |
| `onLeftPaneWidthChange` | The user finishes dragging the vertical splitter. |
| `onGridColumnsChange` | The user finishes dragging a column resize handle. |

### GanttCallbacks Reference

All callbacks are optional. Provide them as the third argument to the
`GanttChart` constructor (or omit it entirely).

```ts
export type OnTaskSelect = (payload: {task: Task}) => void;
export type OnTaskMove = (payload: {task: Task; newStartDate: Date; newEndDate: Date}) => boolean;
export type OnTaskResize = (payload: {task: Task; newDurationHours: number; newStartDate: Date; newEndDate: Date}) => boolean;
export type OnProgressChange = (payload: {task: Task; newPercentComplete: number}) => boolean;
export type OnTaskAdd = (payload: {parentTask: Task}) => boolean;
export type OnTaskDoubleClick = (payload: {task: Task}) => void;
export type OnLinkCreate = (payload: {type: 'FS'; sourceTask: Task; targetTask: Task}) => boolean;
export type OnLinkClick = (payload: {link: Link}) => void;
export type OnLinkDblClick = (payload: {link: Link}) => void;

// Pane-resize hooks (untyped in the type alias but included in GanttCallbacks):
// onLeftPaneWidthChange?: (width: number) => void;
// onGridColumnsChange?: (columns: GridColumn[]) => void;
```

#### `onTaskSelect`

```ts
type OnTaskSelect = (payload: {task: Task}) => void;
```

Fires when a task is selected. The chart uses a strict single-selection model:

- **Click a task** (grid row, bar, or milestone) to select it — fires with the full `Task` object.
- **Click the same task again** — no-op; the callback does not fire again.
- **Click a different task** — switches selection; fires with the new `Task`.
- **Click empty space** in the timeline pane — deselects visually; does **not** fire the callback.
- **Press Escape** — deselects visually; does **not** fire the callback.
- **`instance.select(null)`** — programmatic deselection; does **not** fire the callback.

The callback fires only on actual selection changes to a **task**. Repeated selection of the same task
is silently ignored.

```ts
import type {OnTaskSelect} from 'gantt-renderer';

const onTaskSelect: OnTaskSelect = (payload) => {
	console.log('Selected task', payload.task.text, 'id:', payload.task.id);
};
```

#### `onTaskMove`

```ts
type OnTaskMove = (payload: {task: Task; newStartDate: Date; newEndDate: Date}) => boolean;
```

Fires once after the user releases a task bar drag to a new position on the timeline. The chart
patches its internal state to provide immediate visual feedback during the drag, but the callback
only fires on release. Consumers must persist the change and call `instance.update()` if the
underlying data should reflect the new position.

Return `false` from the callback to abort the move and revert the task to its original position.

| Payload field | Type | Description |
|---|---|---|
| `task` | `Task` | The full task that was moved. |
| `newStartDate` | `Date` | The new start date derived from the drop position on the timeline. |
| `newEndDate` | `Date` | The new end date computed from `newStartDate` and the task's `durationHours`. |

**Edge cases:**

- Dragging a parent task does not move child tasks; only the dragged task is repositioned.
- Dragging a milestone sets a new `newStartDate` but duration remains `0`; `newEndDate` equals `newStartDate`.
- The callback does not fire if the pointer returns to the original position before release.

```ts
import type {OnTaskMove} from 'gantt-renderer';

const onTaskMove: OnTaskMove = ({task, newStartDate, newEndDate}) => {
	// Persist the new start date to your data model, then call instance.update(...)
};
```

#### `onTaskResize`

```ts
type OnTaskResize = (payload: {task: Task; newDurationHours: number; newStartDate: Date; newEndDate: Date}) => boolean;
```

Fires once after the user drags a task bar's resize handle (right edge) to change its duration. The
chart patches its internal state automatically for immediate visual feedback — the bar widens or
narrows before the callback runs. Consumers must persist the change and call `instance.update()`
if the underlying data should reflect the new duration.

Return `false` from the callback to abort the resize and revert the task to its original duration.

| Payload field | Type | Description |
|---|---|---|
| `task` | `Task` | The full task that was resized. |
| `newDurationHours` | `number` | The new duration in hours. Never falls below 1 for task bars; milestones cannot be resized. |
| `newStartDate` | `Date` | The task's unchanged start date. |
| `newEndDate` | `Date` | The new end date computed from `newStartDate` and `newDurationHours`. |

**Edge cases:**

- Milestone bars do not show a resize handle and cannot trigger this callback.
- The minimum post-resize duration is 1 hour.
- The callback does not fire if the pointer returns to the original width before release.

```ts
import type {OnTaskResize} from 'gantt-renderer';

const onTaskResize: OnTaskResize = ({task, newDurationHours, newStartDate, newEndDate}) => {
	// Persist the new duration, then call instance.update(...)
};
```

#### `onProgressChange`

```ts
type OnProgressChange = (payload: {task: Task; newPercentComplete: number}) => boolean;
```

Fires once after the user drags a task bar's progress fill to change its `percentComplete`.
The chart patches its internal state automatically for immediate visual feedback — the progress
bar widens or narrows before the callback runs. Progress dragging must be enabled via the
`progressDragEnabled` option.

Return `false` from the callback to abort the change and revert the task to its original
`percentComplete`.

| Payload field | Type | Description |
|---|---|---|
| `task` | `Task` | The full task whose progress was changed. |
| `newPercentComplete` | `number` | The new completion percentage (`0`–`100`, integer). |

**Edge cases:**

- Milestone tasks do not have a progress overlay and cannot trigger this callback.
- The value is clamped to `0`–`100` and rounded to an integer.
- The callback does not fire if the pointer returns to the original position before release.

```ts
import type {OnProgressChange} from 'gantt-renderer';

const onProgressChange: OnProgressChange = ({task, newPercentComplete}) => {
	// Persist the new percent, then call instance.update(...)
};
```

#### `onTaskAdd`

```ts
type OnTaskAdd = (payload: {parentId: number}) => void;
```

Fires when the user clicks the add-subtask button (`+`) in the actions column of a grid row.
The button is rendered in the `actions` column (which must be present in the `gridColumns` schema
— it is included in the default 3-column layout). The callback receives the parent task's `id`;
consumers are expected to create a new subtask and call `instance.update()`.

Return `false` from the callback to abort the add operation.

| Payload field | Type | Description |
|---|---|---|
| `parentId` | `number` | The `id` of the task whose `+` button was clicked. |

```ts
import type {OnTaskAdd} from 'gantt-renderer';

const onTaskAdd: OnTaskAdd = ({parentId}) => {
	// Open a dialog or form to create a subtask under parentId,
	// then add the new task to your data model and call instance.update(...)
};
```

#### `onTaskDoubleClick`

```ts
type OnTaskDoubleClick = (payload: {task: Task}) => void;
```

Fires when the user double-clicks a task row (in the left grid pane), a task bar (in the timeline),
or a milestone diamond (in the timeline). The payload carries the full `Task` object so you can
access any field directly without a lookup.

| Payload field | Type | Description |
|---|---|---|
| `task` | `Task` | The full task that was double-clicked. |

```ts
import type {OnTaskDoubleClick} from 'gantt-renderer';

const onTaskDoubleClick: OnTaskDoubleClick = ({task}) => {
	console.log(`Editing task "${task.text}"`);
};
```

#### `onLinkCreate`

```ts
type OnLinkCreate = (payload: {type: 'FS'; sourceTask: Task; targetTask: Task}) => boolean;
```

Fires when the user completes a link-creation drag by releasing the pointer over a different task
bar. Link creation must be enabled via the `linkCreationEnabled` option.

| Payload field | Type | Description |
|---|---|---|
| `kind` | `'FS'` | Dependency type. Always `'FS'` (finish-to-start). |
| `sourceTask` | `Task` | The full predecessor task. |
| `targetTask` | `Task` | The full successor task. |
| `kind` | `'FS'` | Dependency type. Always `'FS'` (finish-to-start). |

**Behavior:**

- Dragging from a task bar's endpoint handle to a different task bar creates a finish-to-start
  dependency.
- Releasing over the source task itself cancels the drag — the callback does not fire.
- Releasing over empty space cancels the drag — the callback does not fire.
- The callback does not modify the chart's link data; consumers must add the link to their data
  model and call `instance.update()`.

Return `false` from the callback to abort the link creation.

```ts
import type {OnLinkCreate} from 'gantt-renderer';

const onLinkCreate: OnLinkCreate = (payload) => {
	// Add the link to your data model and call instance.update(...)
};
```

#### `onLinkClick`

```ts
type OnLinkClick = (payload: {link: Link}) => void;
```

Fires when the user clicks a dependency link arrow or path in the timeline. The payload includes
the full `Link` object.

| Payload field | Type | Description |
|---|---|---|
| `link` | `Link` | The link that was clicked. |

```ts
import type {OnLinkClick} from 'gantt-renderer';

const onLinkClick: OnLinkClick = ({link}) => {
	console.log(`Link ${link.id} (${link.source} → ${link.target}, ${link.type}) clicked`);
};
```

#### `onLinkDblClick`

```ts
type OnLinkDblClick = (payload: {link: Link}) => void;
```

Fires when the user double-clicks a dependency link arrow or path in the timeline. The payload
is identical to `onLinkClick`.

| Payload field | Type | Description |
|---|---|---|
| `link` | `Link` | The link that was double-clicked. |

```ts
import type {OnLinkDblClick} from 'gantt-renderer';

const onLinkDblClick: OnLinkDblClick = ({link}) => {
	console.log(`Link ${link.id} (${link.source} → ${link.target}, ${link.type}) double-clicked`);
};
```

#### `onLeftPaneWidthChange`

```ts
type OnLeftPaneWidthChange = (width: number) => void;
```

Fires on `pointerup` after the user finishes dragging the vertical splitter between the grid and
timeline panes. Does not fire on every pixel of the drag — only once when the user releases the
mouse or lifts their finger.

| Parameter | Type | Description |
|---|---|---|
| `width` | `number` | The final left-pane width in pixels. |

Use this to persist the user's preferred pane width and restore it on the next mount via the
`leftPaneWidth` option.

```ts
const instance = new GanttChart(container, {
	leftPaneWidth: savedWidth, // restore from localStorage
}, {
	onLeftPaneWidthChange: (width) => {
		localStorage.setItem('gantt-left-pane-width', String(width));
	},
});
```

#### `onGridColumnsChange`

```ts
type OnGridColumnsChange = (columns: GridColumn[]) => void;
```

Fires on `pointerup` after the user finishes dragging a column resize handle in the grid header.
Does not fire on every pixel of the drag — only once when the user releases. All `width` values in
the returned array are converted to `px` strings (e.g. `'1fr'` becomes the computed pixel
equivalent).

| Parameter | Type | Description |
|---|---|---|
| `columns` | `GridColumn[]` | The full column array with updated `width` values as `px` strings. |

Use this to persist the user's column widths and restore them on the next mount via the
`gridColumns` option.

```ts
const instance = new GanttChart(container, {
	gridColumns: savedColumns, // restore from localStorage
}, {
	onGridColumnsChange: (columns) => {
		localStorage.setItem('gantt-grid-columns', JSON.stringify(columns));
	},
});
```

### Input data structure

The chart renders data in the shape of `GanttInput`, which consists of two arrays:
`tasks` (required, at least one) and `links` (optional).

```ts
export type GanttInput<TTaskData = never, TLinkData = never> = {
	tasks: Task<TTaskData>[];
	links: Link<TLinkData>[];
};
```

Pass your raw data directly to `update(yourData)` — the method validates against the `zod` schemas
internally and applies defaults. For typed `data` properties,
annotate your raw object with `GanttInputRaw<TTaskData, TLinkData>` and TypeScript will
enforce the `data` shape at compile time.

#### `Task`

Each `Task` object defines one row in the chart — either a regular task, a summary project row,
or a zero-duration milestone.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|---|
| `id` | `number` | **yes** | — | Unique positive integer identifier. |
| `text` | `string` | **yes** | — | Display name / label. |
| `startDate` | `string` | **yes** | — | ISO date `YYYY-MM-DD`. Determines the visual start position on the timeline. |
| `endDate` | `string` | **yes** | — | ISO date `YYYY-MM-DD`. Determines the visual end position on the timeline. |
| `parent` | `number` | no | — | `id` of the parent task. When set, this task becomes a child in the tree hierarchy. |
| `percentComplete` | `number` | no | `0` | Completion percentage from `0` to `100` (integer). Rendered as a darker fill inside the task bar. |
| `kind` | `TaskKind` | no | `'task'` | Row variant (see below). |
| `readonly` | `boolean` | no | — | When `true`, the task bar or milestone cannot be dragged or resized. Selection and double-click still work. |
| `data` | `Record<string, unknown>` | no | — | Optional consumer metadata. Use the generic `Task<TData>` for compile-time-typed data (see [Typed task and link data](#typed-task-and-link-data)). |

##### Task kind values (`TaskKind`)

| Value | Description |
|---|---|
| `'task'` | A regular task with a colored bar. |
| `'project'` | A summary / group row with a colored bar. Same visual as `'task'`. |
| `'milestone'` | A zero-duration marker rendered as a diamond. |

Tasks with `type: 'project'` typically have children. The chart uses the `parent` field —
not the `kind` — to build the tree hierarchy.

#### `Link`

Each `Link` object defines a dependency arrow between two tasks.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|---|
| `id` | `number` | **yes** | — | Unique positive integer identifier for the link. |
| `source` | `number` | **yes** | — | The `id` of the predecessor task. |
| `target` | `number` | **yes** | — | The `id` of the successor task. |
| `kind` | `LinkType` | no | `'FS'` | Dependency constraint type (see below). |
| `readonly` | `boolean` | no | — | When `true`, the link cannot be modified or deleted through the UI. |
| `data` | `Record<string, unknown>` | no | — | Optional consumer metadata. Use the generic `Link<TData>` for compile-time-typed data (see [Typed task and link data](#typed-task-and-link-data)). |

##### Link type values (`LinkType`)

| Value | Name | Description |
|---|---|---|
| `'FS'` | Finish-to-start | Successor starts after predecessor finishes. The most common dependency. |
| `'SS'` | Start-to-start | Successor starts at the same time as predecessor. |
| `'FF'` | Finish-to-finish | Successor finishes at the same time as predecessor. |
| `'SF'` | Start-to-finish | Successor finishes after predecessor starts. |

Both `source` and `target` must reference valid `id` values present in the `tasks` array.
Schema validation only checks field types and constraints; `validateLinkRefs(tasks, links)` from the
public API detects dangling references at runtime (called automatically by `update`).

#### `TaskNode` (internal domain type)

`TaskNode` is the internal tree-shaped type produced by `buildTaskTree(tasks)`. It extends
`Task` with two computed fields:

| Field | Type | Description |
|---|---|---|---|
| `children` | `TaskNode[]` | Array of child nodes in the tree hierarchy. Populated by `buildTaskTree`. |
| `depth` | `number` | Nesting depth. `0` = root-level task. |

Consumers don't create `TaskNode` directly; it is only used internally for virtualized row
rendering and timeline layout. The `GanttCallbacks` (e.g., `onTaskSelect`, `onTaskDoubleClick`)
return the flat `Task` shape, not `TaskNode`.

#### Typed task and link data

The `Task`, `Link`, `GanttInput`, and `GanttChart` types accept optional generic type
parameters for the `data` property. By default the type parameter is `never`, which prevents
the `data` property from being used. Specify a concrete type to enable compile-time-checked
`data` throughout the API.

**Default (no data can be set or accessed):**

```ts
import {GanttChart} from 'gantt-renderer';

// With default generic params, `data` is forbidden on tasks and links:
const instance = new GanttChart(container, {scale: 'day'});
instance.update({
	tasks: [
		{id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task'},
		// data: {} ← TypeScript error: data does not exist
	],
	links: [],
});

instance.setCallbacks({
	onTaskClick: ({task}) => {
		// task.data ← TypeScript error: data does not exist
	},
	onTaskMove: ({task}) => {
		// task.data ← TypeScript error: data does not exist
	},
});
```

**With typed data:**

```ts
import {type GanttCallbacks} from 'gantt-renderer';

interface CustomTaskData {
	owner: string;
	priority: 'low' | 'medium' | 'high';
}

interface CustomLinkData {
	label: string;
}

const raw = {
	tasks: [
		{
			id: 1, text: 'Task', startDate: '2026-01-01', endDate: '2026-01-03',
			kind: 'task' as const,
			data: {owner: 'alice', priority: 'high' as const},
		},
	],
	links: [
		{id: 1, source: 1, target: 2, type: 'FS' as const, data: {label: 'blocks'}},
	],
};

const instance = new GanttChart<CustomTaskData, CustomLinkData>(container, {scale: 'day'});
instance.update(raw);

const cbs: GanttCallbacks<CustomTaskData, CustomLinkData> = {
	onTaskClick({task}) {
		// task.data is CustomTaskData | undefined
		console.log(task.data?.owner);
	},
	onLinkClick({link}) {
		// link.data is CustomLinkData | undefined
		console.log(link.data?.label);
	},
};
instance.setCallbacks(cbs);
```

**Key types:**

| Type | Signature |
|---|---|
| `Task<TData = never>` | Task with optional typed `data`. Default `never` forbids `data`. |
| `Link<TData = never>` | Link with optional typed `data`. Default `never` forbids `data`. |
| `GanttInput<TTaskData = never, TLinkData = never>` | Parsed input with typed task/link data. |
| `GanttInputRaw<TTaskData = never, TLinkData = never>` | Unvalidated input type — enforces `data` shape at compile time. |
| `GanttChart<TTaskData = never, TLinkData = never>` | Chart class with typed data. |
| `GanttCallbacks<TTaskData = never, TLinkData = never>` | Callbacks with typed task/link payloads. |
| `GanttInstance<TTaskData = never, TLinkData = never>` | Instance type with typed update/setCallbacks. |
| `OnTaskClick<TTaskData, TLinkData>` | Callback with typed task data. |
| `OnTaskMove<TTaskData, TLinkData>` | Callback with typed task data. |
| `OnTaskResize<TTaskData, TLinkData>` | Callback with typed task data. |
| `OnTaskAdd<TTaskData, TLinkData>` | Callback with typed task data. |
| `OnLinkCreate<TTaskData, TLinkData>` | Callback with typed task/link data. |
| `OnLinkClick<TTaskData, TLinkData>` | Callback with typed link data. |
| `OnLinkDblClick<TTaskData, TLinkData>` | Callback with typed link data. |
| `OnProgressChange<TTaskData, TLinkData>` | Callback with typed task data. |
| `OnTooltipText<TTaskData, TLinkData>` | Callback with typed task data. |

When types are specified on `GanttChart`, they propagate automatically to `setCallbacks()`.
Callbacks can also be typed independently using the generic callback types listed above.

`GanttChart` accepts the same type parameters. When you pass them, the
class validates `data` shapes at compile time through the `GanttInputRaw<TTaskData, TLinkData>`
input type accepted by `update()`. Runtime validation remains schema-driven; `data` is always checked as a generic object
by zod regardless of the type parameter.

```ts
const raw: GanttInputRaw<MyTaskData, MyLinkData> = {
	tasks: [{id: 1, text: 'A', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task', data: {priority: 1}}],
};

instance.update(raw);
```

### Time scale

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

Change the scale dynamically with `setOptions({scale: 'week'})`.

### Viewport control

Control the initial visible date range and overall chart dimensions:

- `height?: number` — Overall chart height in pixels. Default is `500`. The grid body and timeline fill the remaining space after the header.
- `viewportStart?: Date` — Override the left boundary of the initial viewport. When omitted, the viewport starts at the earliest task start date.
- `viewportEnd?: Date` — Override the right boundary of the initial viewport. When omitted, the viewport ends at the latest task end date.

Use these to pin the initial scroll position to a specific date range:

```ts
const instance = new GanttChart(container, {
	scale: 'day',
	viewportStart: new Date('2026-06-01'),
	viewportEnd: new Date('2026-07-15'),
});
instance.update(input);
```

### Selection model

The chart uses a strict single-selection model:

- **Click a task** (grid row, bar, or milestone) to select it.
- **Click the same task again** — no-op; the selection stays on that task.
- **Click a different task** — switches selection to the new task.
- **Click empty space** in the timeline pane — deselects (clears selection).
- **Press Escape** — deselects when a task is selected.
- **`instance.select(null)`** — programmatic deselection.

The `onTaskSelect` callback fires only on actual selection changes; repeated clicks on the same task do not emit duplicate events. See [`onTaskSelect`](#ontaskselect) for the callback signature.

#### Selection visual style

Selected bars and milestones use a subtle emphasis style rather than a dominant outline.

- Selected timeline shapes receive `.gantt-shape--selected`.
- The default theme uses `--gantt-selection-ring` and `--gantt-selection-glow` tokens.
- Consumers can override these CSS variables/classes to tune selection emphasis without changing interaction behavior.

---

## Part 2 — Customization

Options that adapt the chart's appearance and behavior to your specific needs.

### Locale / Internationalization

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
		columnStartDate: 'Start',
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
| `columnStartDate` | `Start` | Grid column header |
| `columnEndDate` | `End` | Grid column header |
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

#### Built-in locales

The library ships with nine prebuilt `ChartLocale` constants covering common languages:

| Constant | Code | Language |
|---|---|---|
| `CHART_LOCALE_EN_US` | `en-US` | English (US) |
| `CHART_LOCALE_EN_GB` | `en-GB` | English (UK) |
| `CHART_LOCALE_DE_DE` | `de-DE` | German |
| `CHART_LOCALE_FR_FR` | `fr-FR` | French |
| `CHART_LOCALE_ES_ES` | `es-ES` | Spanish |
| `CHART_LOCALE_IT_IT` | `it-IT` | Italian |
| `CHART_LOCALE_PT_PT` | `pt-PT` | Portuguese |
| `CHART_LOCALE_ZH_CN` | `zh-CN` | Chinese (Simplified) |
| `CHART_LOCALE_JA_JP` | `ja-JP` | Japanese |

Each constant includes translated chart labels (`ariaTask`, `columnTaskName`, etc.) and
pre-configured `weekStartsOn`, `weekNumbering`, and `weekendDays`.

```ts
import {GanttChart, CHART_LOCALE_DE_DE, CHART_LOCALE_FR_FR} from 'gantt-renderer';

// Pass the constant directly
const instance = new GanttChart(container, {
	locale: CHART_LOCALE_DE_DE,
});

// Or switch at runtime
instance.setOptions({locale: CHART_LOCALE_FR_FR});
```

For any other language, pass a BCP 47 string — the chart derives calendar
conventions automatically but uses English fallback labels.

### Grid column schema

`GanttOptions` includes a `gridColumns` option for customising the left-pane grid:

- `gridColumns?: GridColumn[]` - Column schema array. When omitted, `gridColumnDefaults(locale)` generates a localized 3-column layout (name, start, actions).

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
	{id: 'percentComplete', header: 'Progress', width: '70px', align: 'right', field: 'percentComplete', format: (v) => `${String(v)}%`},
	{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
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

### Theme & Styling

#### Theme mode

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

#### Container framing tokens

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

#### Typography scale

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

#### Density constants

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

### Responsive options

`GanttOptions` includes responsive controls for narrow viewports:

- `leftPaneWidth?: number` - Explicit left grid pane width in px. When omitted, the width is derived from the grid column schema using `gridNaturalWidth()` and viewport-proportional clamping (desktop: 25%–40% of viewport; mobile: see below).
- `responsiveSplitPane?: boolean` - Enables automatic mobile adaptation (default `true`).
- `mobileBreakpoint?: number` - Viewport/container width threshold for mobile behavior (default `768`).
- `mobileLeftPaneMinWidth?: number` - Minimum left-pane width in mobile mode (default `140`).
- `mobileLeftPaneMaxRatio?: number` - Max left-pane share of viewport in mobile mode (default `0.45`).
- `timelineMinWidth?: number` - Minimum timeline pane width; if needed, horizontal scrolling is used (default `220`).

The chart automatically detects container size changes using a `ResizeObserver` (with a `window.resize` fallback). When the container resizes — whether from a window resize, sidebar toggle, or layout change — the left/right pane widths are recalculated on the fly. No manual call is needed; as long as the container element is sized responsively (e.g. `width: 100%` in a flex or grid layout), the chart adapts automatically.

This keeps the timeline visible at narrow widths (for example `375px`) while preserving desktop behavior.
On desktop, the pane width is clamped between `viewportWidth * 0.25` and `viewportWidth * 0.4`, with the natural width computed from the active column schema as the initial value.

#### `gridNaturalWidth(columns)` and `GRID_COLUMN_FR_MIN_WIDTH`

Exported from the public API alongside `DEFAULT_GRID_COLUMNS`:

- `gridNaturalWidth(columns: GridColumn[]): number` — computes the minimum natural px width from a grid column schema. Fixed `px` columns sum directly; each `fr` unit contributes `GRID_COLUMN_FR_MIN_WIDTH` px (default `120`). Hidden columns are skipped.
- `GRID_COLUMN_FR_MIN_WIDTH` — px contribution per `fr` unit used by `gridNaturalWidth` (default `120`).

### Special-day options

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

#### Header special-day indicators

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

### Dependency-link highlight

`GanttOptions` includes dependency-link selection highlight controls:

- `highlightLinkedDependenciesOnSelect?: boolean` - When `true`, links related to the selected task use highlight color/arrow styling. Default is `false`.

By default, task selection does not change dependency link color, arrow marker, or stroke width.

### Link-creation

`GanttOptions` includes interactive link-creation controls for dependency links:

- `linkCreationEnabled?: boolean` - Enables per-task endpoint handles and drag-to-create-link interactions. Default is `false`.

When enabled:

- Task bars show two endpoint handles (left = start, right = finish) on hover; milestones show one center handle.
- Dragging from a handle draws a ghost line in the SVG dependency layer (dashed when no target, solid with arrow when over a valid bar).
- Releasing over a different task bar fires `onLinkCreate` with `{sourceTaskId, targetTaskId, type: 'FS'}`.
- Releasing over the source task or empty space cancels the drag with no callback.
- Handles are keyboard-accessible with `tabindex="0"`, `role="button"`, and descriptive `aria-label`.

Example — enable link creation and handle new links:

```ts
import {GanttChart, type OnLinkCreate} from 'gantt-renderer';

const onLinkCreate: OnLinkCreate = (payload) => {
	console.log('New link:', payload);
	// Add the link to your data model and call instance.update(...)
};

const instance = new GanttChart(container, {
	linkCreationEnabled: true,
}, {
	onLinkCreate,
});
instance.update(input);
```

---

## Package API

The primary entrypoint is `src/lib/index.ts`, which exports:

- Core input and domain types (`Task`, `Link`, `GanttInput`, `TaskNode`, and related types).
- Locale types and utilities (`ChartLocale`, `LocaleLabelKey`, `resolveChartLocale`, `deriveWeekendDays`, etc.).
- Validation is handled automatically by `GanttChart.update()` using internal zod schemas.
- Timeline/domain utilities (`computeLayout`, `createPixelMapper`, `routeLinks`, and others).
- Vanilla chart class (`GanttChart`) and instance/callback types.
