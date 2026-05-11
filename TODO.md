# Implementation Prompts — Remaining Gap Tasks

---

## Task 1: Eventually add locale for the following languages

en, zh-Hans, zh-Hant, es, pt-BR, pt-PT, fr, de, ru, ja, ko, ar, hi, id, th, tr, it, pl, nl, sv, da, nb, fi, uk, ro, cs, hu, el, sk, bg, hr, sr, lt, lv, et, sl, be, sq, mk, ca, eu, cy, ga, mt

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

