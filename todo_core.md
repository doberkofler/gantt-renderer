# Todo: Core Chart Implementation

## Scope
- Includes: chart/grid rendering, task bars, timeline header, links, selection behavior, drag/resize UX, and responsive split-pane behavior.
- Primary target paths: `src/gantt-chart/**/*`, `src/styles/gantt.css`.
- Excludes: outer-page toolbars, export buttons, fullscreen shell controls, and demo-only control rows.

## Ticket-Ready Backlog (`gantt-core/*`)

### `gantt-core/M8-visualize-special-days-in-header`
- **Type**: ux-polish
- **Scope**: Add lightweight visual affordance in the timeline header for configured special days (weekend/holiday/custom).
- **Files**: `src/gantt-chart/vanilla/dom/timeHeader.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Header cells can reflect special-day semantics without reducing label readability.
  - Behavior is consistent with day-body special-day rendering and remains deterministic for date-only inputs.
  - Feature is optional or subtle enough to avoid visual noise at dense zoom levels.

## Verification Checklist (Core)
- Internationalization: `ChartLocale` drives date formats, week calculation, and all UI strings.
- Canonical locale resolution (weekStartsOn, weekNumbering) matches `Intl.Locale` conventions.
- Horizontal right-panel scroll no longer extends beyond timeline content.
- Calendar header remains coherent across full scroll range.
- At `375px`, timeline remains visible and navigable.
- Selecting a task does not auto-recolor links (unless explicit mode enabled).
- Selected task style matches target emphasis level.
- Link endpoint controls are present and usable.
- Task edit intent API supports custom external dialogs.
- Special-day rendering (weekend/holiday/custom) is available through the public API.
- All zoom levels in the zoom control are implemented and switch correctly.
- Geometry parity: row/bar/milestone sizes match targets.

## Open Issues
| Issue |
| --- |
| `gantt-core/M8-visualize-special-days-in-header` |

## Fixed Issues
| Issue | Fixed On |
| --- | --- |
