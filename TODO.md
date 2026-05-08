# Implementation Prompts — Remaining Gap Tasks

---

## Task 1: Task `readonly` Support

### Context

Some tasks should be visual-only and not draggable or resizable — locked tasks, reference tasks,
or tasks managed externally. Currently, the only way to prevent drag is by returning `false` from
`onTaskMove` / `onTaskResize` callbacks, but the bar still moves visually during drag and then
snaps back — creating a jarring user experience. The drag should be **prevented before it starts**,
not reverted after.

### What to Do

**1. Add `readonly` to the Task schema** (`src/lib/validation/schemas.ts`)

In `taskBase` (lines 15-28), add:

```ts
/** When `true`, the task bar cannot be dragged or resized. */
readonly: z.boolean().optional(),
```

**2. Respect `readonly` in bar/milestone rendering** (`src/lib/vanilla/dom/rightPane.ts`)

In `renderBar` (line 138):
- When `task.readonly === true`:
  - Change cursor to `'pointer'` (or `'default'`) instead of `'grab'`
  - Do **not** create/append the resize handle (`handle` div)
  - Do **not** call `attachDrag` — skip cleanupDrag assignment
  - Still allow click to select and keydown for accessibility
  - Still allow link-creation endpoint handles (readonly shouldn't block linking)

In `renderMilestone` (line 301):
- When `task.readonly === true`:
  - Change cursor to `'default'` instead of `'pointer'`
  - Do **not** call `attachMilestoneClick` — skip cleanupDrag assignment
  - Still allow keyboard and click to select
  - Still allow link-creation endpoint handle

**3. In the registry entry** (lines 283-296 for bars, lines 390-400 for milestones):
- `cleanupDrag` may be undefined when readonly — the registry type already uses optional fields
  (`cleanupLinkHandles?:`, `cleanupProgressDrag?:`), but `cleanupDrag` is required. Make it optional.

### Verification

- `pnpm run ci` passes (typecheck, lint, build, test)
- `pnpm run integration-test` passes
- Add a unit test: task with `readonly: true` should have no resize handle and no drag behavior
- Add/update integration test: readonly task cannot be dragged

### Files to Modify

| File | Change |
|---|---|
| `src/lib/validation/schemas.ts` | Add `readonly` to `taskBase` |
| `src/lib/vanilla/dom/rightPane.ts` | Check `readonly` in `renderBar` and `renderMilestone` |

---

## Task 3: Link `readonly` Support

### Context

Some dependency links are system-generated or automatically maintained and should not be editable
through UI interactions. Adding a `readonly` field to the Link type enables consumers to mark links
as immutable, allowing the chart to suppress delete or modify UI operations for those links.

This is a purely additive schema change with no behavioral impact in the current implementation —
the UI does not yet expose link-delete or link-edit interactions.

### What to Do

**Add `readonly` to the Link schema** (`src/lib/validation/schemas.ts`)

In `LinkSchema` (lines 65-90), add after the `data` field:

```ts
/** When `true`, the link cannot be modified or deleted through the UI. */
readonly: z.boolean().optional(),
```

No behavioral changes needed. The field passes through `parseGanttInput` and is preserved in
`link.data` or as a dedicated field.

### Verification

- `pnpm run ci` passes
- `pnpm run integration-test` passes

### Files to Modify

| File | Change |
|---|---|
| `src/lib/validation/schemas.ts` | Add `readonly` to `LinkSchema` |

---

## Task 5: Link `lag` Support

### Context

Dependency links sometimes need a delay or overlap between tasks. For example, concrete must cure
for 3 days before framing can start, or development can begin 1 day before design sign-off. Without
lag support, arrows connect directly from anchor to anchor with no visual offset — losing the
visual cue that a gap or overlap exists between dependent tasks.

### What to Do

**1. Add `lag` to the Link schema** (`src/lib/validation/schemas.ts`)

In `LinkSchema` (lines 65-90), add after `type`:

```ts
/**
 * Lead/lag offset in hours. Positive = gap after predecessor finishes;
 * negative = overlap. Rendered as an offset in the dependency arrow path.
 */
lag: z.number().optional(),
```

Use hours (not days) for consistency with `durationHours`.

**2. Apply lag in the link router** (`src/lib/rendering/linkRouter.ts`)

The `routeLinks` function (line 335) needs to apply lag to arrow routing. The cleanest approach:

a. The `PixelMapper` already has `durationToWidth(hours)` → px. Pass a pixel conversion to
   `routeLinks`.

b. Modify the `routeLinks` signature:

```ts
export function routeLinks(
  links: Link[],
  layouts: Map<number, BarLayout>,
  getPixelOffset?: (hours: number) => number,
): RoutedLink[]
```

c. In the `route` function (or `getAnchors`), apply lag as a rightward x-offset on the source
   anchor:

```ts
const lagPx = link.lag ? getPixelOffset?.(link.lag) ?? 0 : 0;
// In `getAnchors`, add lagPx to the source anchor x
// e.g., for FS: return {sx: srcRight + lagPx, tx: tgtLeft}
```

The simplest approach: apply `lagPx` as a positive rightward offset to `sx` in `getAnchors`. This
creates a visual gap between the predecessor bar edge and the arrow exit point.

**3. Update the caller** (`src/lib/vanilla/gantt-chart.ts`)

In `#computeState` (line 597), pass the pixel mapper to `routeLinks`:

```ts
const links = routeLinks(input.links, layouts, (hours) => mapper.durationToWidth(hours));
```

### Verification

- `pnpm run ci` passes
- `pnpm run integration-test` passes
- Add a unit test for `routeLinks` with lag: a link with positive lag should have its first anchor
  point shifted right
- Add a unit test for `routeLinks` with negative lag
- Update an integration test to verify lag renders correctly (arrow exits with a visible gap)

### Files to Modify

| File | Change |
|---|---|
| `src/lib/validation/schemas.ts` | Add `lag` to `LinkSchema` |
| `src/lib/rendering/linkRouter.ts` | Accept pixel converter, apply lag offset in routing |
| `src/lib/vanilla/gantt-chart.ts` | Pass mapper to `routeLinks` |
| `src/lib/index.ts` | No changes needed (types auto-exported) |

---

## Task 6: Per-Task CSS Class Support

### Context

Different task types often need distinct visual styling beyond a simple bar fill color — they may
require different text colors, border styles, or milestone diamond shapes. For example: summary /
group tasks (green styling), locked / frozen tasks (orange), decision / gate tasks (red), and
inactive / deprecated tasks (grey).

The current `task.color` option only controls bar fill color, which is insufficient when the visual
identity of a task type involves multiple properties (text color, border, iconography).

### What to Do

**1. Add `className` to the Task schema** (`src/lib/validation/schemas.ts`)

In `taskBase` (lines 15-28), add:

```ts
/**
 * Optional CSS class name applied to the task bar or milestone DOM element.
 * Enables per-task visual styling (colors, borders, text style).
 */
className: z.string().min(1).optional(),
```

**2. Apply `className` in bar rendering** (`src/lib/vanilla/dom/rightPane.ts`)

In `renderBar` (line 152), include the class name on the bar element:

```ts
const classes = ['gantt-bar'];
if (task.className) classes.push(task.className);
if (selected) classes.push('gantt-bar--selected', 'gantt-shape--selected');
bar.className = classes.join(' ');
```

**3. Apply `className` in milestone rendering** (`src/lib/vanilla/dom/rightPane.ts`)

In `renderMilestone` (line 315), include the class name on the diamond element:

```ts
const classes = ['gantt-milestone'];
if (task.className) classes.push(task.className);
if (selected) classes.push('gantt-shape--selected');
diamond.className = classes.join(' ');
```

### Verification

- `pnpm run ci` passes
- `pnpm run integration-test` passes
- Add a unit test: task with `className: 'my-custom'` should have the class on the bar element
- Add an integration test: task with a custom CSS class renders with the correct visual (e.g.,
  different color)

### Files to Modify

| File | Change |
|---|---|
| `src/lib/validation/schemas.ts` | Add `className` to `taskBase` |
| `src/lib/vanilla/dom/rightPane.ts` | Apply `className` in `renderBar` and `renderMilestone` |

---

## Task 7: Custom Tooltip Support

### Context

When hovering over a task bar or milestone, users often need contextual information beyond what is
visible in the left grid pane: task metadata, progress details, date ranges with time precision, or
custom status indicators. There is no built-in tooltip system — consumers must implement their own
hover-overlay logic from scratch.

### What to Do

**1. Add tooltip callback to `GanttCallbacks`** (`src/lib/vanilla/gantt-chart.ts`)

Add a new callback type (around line 29):

```ts
export type OnTooltipText = (payload: {task: Task}) => string | null;
```

Add it to `GanttCallbacks` (around line 31):

```ts
onTooltipText?: OnTooltipText;
```

Add the internal binding in the constructor (around line 175, in the `#cbs` object). The internal
callback format:

```ts
onTooltipText?: (payload: {id: number; task: Task}) => string | null;
```

Wire it to call `this.#callbacks.onTooltipText?.({task: payload.task})`.

**2. Create a tooltip element** (`src/lib/vanilla/dom/rightPane.ts` or a new file)

In `renderBar` and `renderMilestone`:
- On `mouseenter` (or a dedicated tooltip event), call the callback to get HTML string
- If string is non-null, create/position a tooltip element

Tooltip behavior:
- Use a single reusable tooltip div (singleton pattern) positioned in the scroll container
- Show on `mouseenter`, hide on `mouseleave`
- Position near the pointer using `mousemove` events, clamped to viewport
- Style as a floating `div` with:
  - Solid background (var(--gantt-bg))
  - Border (var(--gantt-border))
  - Box shadow
  - Appropriate z-index (higher than bars, lower than handles)
  - Max-width restriction

**3. Add CSS for the tooltip** (optional — can use inline styles initially)

Add to `src/styles/gantt.css`:

```css
.gantt-tooltip {
  position: fixed;
  z-index: 100;
  background: var(--gantt-bg);
  border: 1px solid var(--gantt-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  font-size: var(--gantt-font-size-sm);
  color: var(--gantt-text);
  pointer-events: none;
  max-width: 260px;
}
```

### Verification

- `pnpm run ci` passes
- `pnpm run integration-test` passes
- Add a unit test: `onTooltipText` callback is called on bar hover
- Add an integration test: tooltip renders with correct content on hover

### Files to Modify

| File | Change |
|---|---|
| `src/lib/vanilla/gantt-chart.ts` | Add `OnTooltipText` type, `onTooltipText` to `GanttCallbacks`, wire internal callback |
| `src/lib/vanilla/dom/rightPane.ts` | Add tooltip DOM element, mouseenter/mousemove/mouseleave handlers |
| `src/styles/gantt.css` | Add `.gantt-tooltip` styles |
