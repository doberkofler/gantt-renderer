# Todo: Core Chart Implementation

## Scope
- Includes: chart/grid rendering, task bars, timeline header, links, selection behavior, drag/resize UX, and responsive split-pane behavior.
- Primary target paths: `src/gantt-chart/**/*`, `src/styles/gantt.css`.
- Excludes: outer-page toolbars, export buttons, fullscreen shell controls, and demo-only control rows.

## Ticket-Ready Backlog (`gantt-core/*`)

### `gantt-core/C1-fix-today-marker-scroll-overshoot` (done)
- **Type**: bug
- **Scope**: Clamp or overlay today marker so it cannot expand scroll width.
- **Files**: `src/gantt-chart/vanilla/dom/rightPane.ts`
- **Acceptance criteria**:
  - Horizontal scroll width is bounded to timeline content width in `DAY` and `HOUR` scales.
  - No blank-space overscroll region caused by today marker.
  - Timeline header remains coherent across full scroll range.

### `gantt-core/C2-fix-mobile-timeline-collapse` (done)
- **Type**: bug
- **Scope**: Ensure timeline remains visible and navigable at narrow viewports.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - At `375px` viewport width, right timeline pane remains visible.
  - Left pane width adapts by breakpoint and does not consume full width.
  - Horizontal navigation strategy is defined and testable.

### `gantt-core/C3-provide-task-edit-dialog-api` (done)
- **Type**: feature
- **Scope**: Provide an API/hook so consumers can open and manage a custom task-edit dialog.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/types.ts`, `src/gantt-chart/vanilla/interaction/*`
- **Acceptance criteria**:
  - Consumers can register a callback for task edit intent (for example, double-click on task).
  - Callback payload includes task identity and enough context to open an external dialog.
  - Core chart does not require a built-in modal/lightbox to satisfy edit extensibility.

### `gantt-core/C4-add-link-endpoint-controls`
- **Type**: feature
- **Scope**: Add per-task link handles and creation affordances.
- **Files**: `src/gantt-chart/vanilla/dom/rightPane.ts`, `src/gantt-chart/vanilla/dom/dependencyLayer.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Link endpoint controls appear on eligible task bars.
  - Hover/active states are visible and keyboard-accessible.
  - Creating a link emits expected callback payload.
- **Status**: Fixed (2026-05-06)
- **Notes**:
  - New `GanttOptions.linkCreationEnabled` flag (default `false`) controls per-task endpoint handle visibility and drag-to-create behavior.
  - New `GanttCallbacks.onLinkCreate?: OnLinkCreate` callback fires when a link-creation drag ends on a valid target bar, with payload `{sourceTaskId, targetTaskId, type: 'FS'}`.
  - Task bars get two endpoint handles (left=start, right=finish); milestones get one center handle.
  - Handles show on bar hover (opacity transition), hide on leave; handle hover scales up with highlight color.
  - Drag interaction uses `pointerdown`/`pointermove`/`pointerup` on window with hit-test via `document.elementFromPoint`; ghost line in SVG overlay shows dashed (no target) or solid with arrow (valid target).
  - Self-links are prevented (drag ending on source task is a no-op).
  - Keyboard-accessible: handles have `tabindex="0"`, `role="button"`, `aria-label`.
  - Cleanup of link-creation listeners is handled alongside existing drag listener cleanup in `barRegistry`.
  - Unit tests cover handle creation, drag create, drag cancel, self-link prevention, ghost line visibility, accessibility attributes, and cleanup (11 tests in `linkCreation.test.ts`).
  - Integration tests cover handle presence/absence, `onLinkCreate` callback, self-link prevention, ghost line hide, and accessibility (8 tests in `mount.integration.test.ts`).
  - Updated `src/gantt-chart/vanilla/interaction/linkCreation.ts` (new), `src/gantt-chart/vanilla/dom/dependencyLayer.ts`, `src/gantt-chart/vanilla/dom/rightPane.ts`, `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/state.ts`, `src/styles/gantt.css`, `src/gantt-chart/index.ts`. Tests in `src/gantt-chart/vanilla/interaction/linkCreation.test.ts` and `src/gantt-chart/vanilla/mount.integration.test.ts`. Documentation in `README.md`.

### `gantt-core/C5-add-special-day-rendering-api` (done)
- **Type**: feature
- **Scope**: Add core support and API for rendering special days (weekends, holidays, and custom day types) in the timeline background.
- **Files**: `src/gantt-chart/validation/schemas.ts`, `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/dom/rightPane.ts`, `src/styles/gantt.css`, `src/gantt-chart/index.ts`
- **Acceptance criteria**:
  - Consumers can provide special-day definitions (date + kind/label) via public input/options API.
  - Default weekend highlighting is supported and can be enabled/disabled.
  - Holiday/custom day definitions render with distinct CSS classes in `DAY` scale cells.
  - Rendering is deterministic across locale/timezone boundaries for date-only inputs.
  - API is documented/exported and can be used without demo-only wiring.

### `gantt-core/C6-provide-collapse-expand-all-api` (done)
- **Type**: feature
- **Scope**: Provide public API hooks to collapse all and expand all eligible tree groups so demo-shell controls can be wired without DOM-only workarounds.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/types.ts`, `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/gantt-chart/index.ts`
- **Acceptance criteria**:
  - Public instance API exposes deterministic `collapseAll()` and `expandAll()` methods (or equivalent named hooks).
  - Methods affect all eligible expandable groups and keep leaf rows unchanged.
  - Repeated invocation is idempotent and does not corrupt tree/timeline synchronization.
  - Methods trigger expected rerender/update behavior and remain compatible with existing selection/scroll state rules.
  - Unit tests cover core API behavior and edge cases (empty trees, already-collapsed/all-expanded states).

### `gantt-core/M1-tune-selection-visual-style` (done)
- **Type**: ux-polish
- **Scope**: Replace strong outline with subtler selected-task styling.
- **Files**: `src/styles/gantt.css`, `src/gantt-chart/vanilla/dom/rightPane.ts`
- **Acceptance criteria**:
  - Selected-task emphasis is visible without dominant red/orange outline.
  - Style is consistent across regular bars and milestones.

### `gantt-core/M2-stop-second-click-deselect-toggle` (done)
- **Type**: behavior
- **Scope**: Keep same-task repeated click selected; separate explicit deselect action.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/gantt-chart/vanilla/dom/rightPane.ts`
- **Acceptance criteria**:
  - Repeated click on selected task does not deselect it.
  - Deselect remains available via background click or explicit close action.
- **Status**: Fixed (2026-05-06)
- **Notes**:
  - Guard `if (selectedId === id) return;` in the internal `onSelect` callback prevents second-click deselection for grid rows, bars, and milestones.
  - Background-click deselection on the timeline pane (click empty space → deselect) wired on `rightPaneRefs.absoluteLayer`, guarded by `closest('.gantt-bar, .gantt-milestone, .gantt-resize-handle')` to not interfere with bar clicks.
  - Escape-key deselection handled on the chart `root` element; fires only when `selectedId !== null`.
  - Programmatic deselection via `instance.select(null)` remains available.
  - Regression coverage in `mount.integration.test.ts` (6 tests: repeated grid/bar/milestone click, background click, Escape with/without selection).

### `gantt-core/M3-decouple-link-highlight-from-selection` (done)
- **Type**: behavior
- **Scope**: Remove/gate automatic link recolor when selecting tasks.
- **Files**: `src/gantt-chart/vanilla/dom/dependencyLayer.ts`
- **Acceptance criteria**:
  - Task selection does not change link color/arrow by default.
  - Optional highlight mode (if retained) is explicit and off by default.

### `gantt-core/M4-align-grid-schema-and-widths`
- **Type**: feature
- **Scope**: Replace static left-pane columns with a dynamic, schema-driven grid column model.
- **Files**: `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/gantt-chart/vanilla/dom/gridColumns.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Grid columns are defined via a configurable column schema (no hard-coded column list/order).
  - It is possible to control column visibility, order, alignment, and widths through configuration.
  - Column content is assigned dynamically per task entry (field-mapped and computed content supported).
  - A default schema preserves current behavior when no custom schema is provided.
  - Header labels, widths, and alignments render consistently for both header and body cells.
  - Automated tests cover default schema behavior and custom schema behavior.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Introduced `GridColumn` interface (`src/gantt-chart/vanilla/dom/gridColumns.ts`) with `id`, `header`, `width`, `align`, `visible`, `field`, and `format` properties.
  - `DEFAULT_GRID_COLUMNS` preserves the current 4-column layout (name, start_date, duration, actions).
  - `buildRow()` and `buildLeftPaneHeader()` compute `gridTemplateColumns` from visible columns, ensuring header/body alignment consistency.
  - `renderLeftPane()` accepts a `columns` parameter; `mount()` threads it through `GanttOptions.gridColumns`.
  - Exported via `index.ts`; 72 unit tests added in `leftPane.test.ts`.

### `gantt-core/M5-align-time-header-cadence`
- **Type**: behavior
- **Scope**: Align dual-row timeline header formatting and bucket cadence.
- **Files**: `src/gantt-chart/vanilla/dom/timeHeader.ts`, `src/gantt-chart/timeline/scale.ts`
- **Acceptance criteria**:
  - Header rows use agreed upper/lower label formats.
  - Bucket boundaries are consistent with expected cadence.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Month/quarter/year boundaries now step by true UTC calendar units instead of fixed day approximations.
  - Header rows and right-pane grid lines share the same boundary cadence to prevent drift.
  - Regression coverage added in `src/gantt-chart/timeline/scale.test.ts`.

### `gantt-core/M6-align-density-constants`
- **Type**: ux-polish
- **Scope**: Tune row height, bar height, milestone size.
- **Files**: `src/gantt-chart/timeline/layoutEngine.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Row/bar/milestone dimensions match approved target values.
  - Vertical alignment and hit areas remain correct.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Centralized into a `DENSITY` constant object (`layoutEngine.ts:6`): row 44, bar 28, milestone 20.
  - CSS density tokens `--gantt-row-height`, `--gantt-bar-height`, `--gantt-milestone-size` added.
  - `MILESTONE_SIZE` and `MILESTONE_HALF` are derived from `DENSITY.milestoneSize`.
  - All exported via `index.ts`; regression coverage added in `layoutEngine.test.ts` and `mount.integration.test.ts`.

### `gantt-core/M7-rebalance-left-pane-width`
- **Type**: ux-polish
- **Scope**: Rebalance grid/timeline proportion by viewport and schema.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/dom/gridColumns.ts`, `src/gantt-chart/vanilla/dom/leftPane.test.ts`, `src/gantt-chart/vanilla/mount.integration.test.ts`
- **Acceptance criteria**:
  - Desktop proportion matches approved layout target.
  - Width behavior remains stable across responsive breakpoints.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Replaced static `LEFT_PANE_WIDTH = 340` with schema-derived natural width via `gridNaturalWidth()`.
  - `gridNaturalWidth()` parses `GridColumn.width` strings (`px`, `fr`) using `GRID_COLUMN_FR_MIN_WIDTH = 120`.
  - Desktop: `clamp(naturalWidth, viewportWidth * 0.25, viewportWidth * 0.40)`.
  - Mobile behavior (max ratio 0.45, min 140px) is unchanged.
  - Explicit `opts.leftPaneWidth` overrides all computed logic.
  - 8 unit tests in `leftPane.test.ts` for `gridNaturalWidth`; 5 integration tests in `mount.integration.test.ts` for desktop/mobile/explicit/custom-schema viewport behavior.

### `gantt-core/M9-normalize-typography-scale`
- **Type**: ux-polish
- **Scope**: Normalize chart font sizes/weights to consistent token scale.
- **Files**: `src/styles/gantt.css`
- **Acceptance criteria**:
  - In-chart labels and headers use documented typography scale.
  - No unintended weight/size outliers in core chart surfaces.

### `gantt-core/M10-align-bar-label-placement`
- **Type**: ux-polish
- **Scope**: Align bar label placement/color/weight to target pattern.
- **Files**: `src/gantt-chart/vanilla/dom/rightPane.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Label placement and clipping behavior are consistent across bar sizes.
  - Contrast remains readable in selected and non-selected states.

### `gantt-core/M11-align-add-affordance-visibility`
- **Type**: behavior
- **Scope**: Match baseline visibility and hover semantics for add/toggle affordances.
- **Files**: `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Add/toggle affordances follow agreed baseline visibility rule.
  - Hover behavior is predictable and keyboard-focus compatible.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Unified toggle and add button visibility rule: both default to `opacity: 0.4`, become `opacity: 1` on row hover (`:hover .gantt-toggle, :hover .gantt-add-btn`).
  - Replaced fragile `[style*="gridTemplateColumns"]:hover` selector with `.gantt-row:hover` by adding `gantt-row` CSS class to row wrappers in `leftPane.ts`.
  - Added `:focus-visible` styles for keyboard-focus compatibility on both affordances.
  - Both affordances now share a consistent `border-radius: 3px` and unified transition.
  - Regression coverage added in `leftPane.test.ts` and `affordance.integration.test.ts`.

### `gantt-core/M12-align-container-framing`
- **Type**: ux-polish
- **Scope**: Align border/radius/shadow framing of chart and panes.
- **Files**: `src/styles/gantt.css`, `src/gantt-chart/vanilla/mount.ts`
- **Acceptance criteria**:
  - Container framing tokens match approved design.
  - No visual seams between grid and timeline panes.
- **Notes**:
  - Added `--gantt-container-border-radius`, `--gantt-container-border`, and `--gantt-container-shadow` design tokens in `gantt.css`.
  - Added `.gantt-root` CSS rule referencing the new tokens for border, border-radius, and box-shadow.
  - Removed inline `border` and `borderRadius` from root element in `mount.ts` — container framing is now CSS-only via the `.gantt-root` class, keeping `overflow: hidden` for border-radius clipping.
  - Internal pane dividers (`borderRight` on left pane, `borderBottom` on toolbar, row separators) continue using `--gantt-border` — distinct from container framing tokens.
  - Regression coverage added in `container-framing.integration.test.ts`.

### `gantt-core/M13-resize-left-pane-width`
- **Type**: feature
- **Scope**: Add a draggable vertical splitter between the left grid pane and the right timeline pane so the user can resize the left pane width.
- **Files**: `src/gantt-chart/vanilla/mount.ts`, `src/styles/gantt.css`, `src/gantt-chart/vanilla/dom/helpers.ts`
- **Acceptance criteria**:
  - A visible splitter handle appears between the left and right panes with `cursor: col-resize`.
  - Dragging the splitter resizes the left pane width in real time within min (96px) and max constraints (right pane >= 220px).
  - Split position is preserved across container resize events.
  - Responsive breakpoint behavior remains correct (at mobile breakpoints the splitter may be disabled or re-clamped).
  - No visual seams or layout gaps introduced between panes.
  - A public hook callback `onLeftPaneWidthChange?: (width: number) => void` is added to `GanttCallbacks` so consumers can observe and persist the new left-pane width. The callback fires on drag-end, not on every pixel move.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - Added splitter handle (`.gantt-splitter-handle`) as an absolutely-positioned child of `leftPane` at `right: 0`, extending the full height.
  - Pointer drag handlers update `leftPane.style.width/minWidth/maxWidth` in real time with clamping (min 96px, max = containerWidth - timelineMinWidth).
  - `userSplitWidth` variable preserves user-set width across `ResizeObserver` firings (clamped to current viewport constraints on resize).
  - `onLeftPaneWidthChange` fires on pointerup with the final width in px.
  - Splitter hover states use `--gantt-task` color for visual feedback.

### `gantt-core/M14-resize-left-pane-columns`
- **Type**: feature
- **Scope**: Add draggable resize handles on grid column headers in the left pane so the user can resize individual column widths.
- **Files**: `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/gantt-chart/vanilla/dom/gridColumns.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Resize handles appear on the right edge of resizable column headers with `cursor: col-resize`.
  - Dragging a handle resizes that column's width in real time, updating `gridTemplateColumns` for both header and body rows.
  - Each column respects a minimum width constraint (e.g. 30px) to prevent collapse.
  - `fr`-unit columns absorb or release remaining space correctly when sibling columns are resized.
  - Header and body cells remain aligned at all widths.
  - Default column configuration (via `DEFAULT_GRID_COLUMNS` or custom `gridColumns`) is unchanged when not using resize.
  - A public hook callback `onGridColumnsChange?: (columns: GridColumn[]) => void` is added to `GanttCallbacks` so consumers can observe and persist the updated column widths. The callback fires on drag-end with the full mutated column array, not on every pixel move.
- **Status**: Fixed (2026-05-05)
- **Notes**:
  - `buildLeftPaneHeader` wraps each cell in a positioned wrapper div and appends `.gantt-col-resize-handle` on all but the last visible column.
  - `setupColumnResize(headerEl, bodyEl, columns, onChange)` wires pointerdown/move/up listeners on each handle.
  - During drag, header and body rows get real-time `gridTemplateColumns` updates using px values derived from the initial column widths + drag delta.
  - On drag-end, all visible column `.width` strings are persisted as `'Xpx'` values (converting fr columns to fixed px).
  - `COLUMN_RESIZE_MIN_WIDTH = 30` prevents column collapse.
  - Cleanup function is returned and called in `destroy()`.
  - Regression coverage in `leftPane.test.ts` (6 tests) and `mount.integration.test.ts` (3 tests).

### `gantt-core/M15-add-dark-mode-support`
- **Type**: feature
- **Scope**: Add dark mode support via CSS custom property overrides so the chart respects `prefers-color-scheme` and/or a consumer-provided `data-theme` attribute.
- **Files**: `src/styles/gantt.css`, `src/gantt-chart/vanilla/gantt-chart.ts`, `src/gantt-chart/index.ts`, `src/demo/init.ts`, `src/demo/demo-shell.css`, `index.html`
- **Acceptance criteria**:
  - `[data-theme="dark"]` selector defines dark-mode CSS token overrides using a `data-theme` attribute on the container.
  - When `data-theme` is `"system"` (default), the chart respects `prefers-color-scheme: dark` media query as a fallback via `@media (prefers-color-scheme: dark) { [data-theme="system"] { ... } }`.
  - All chart surfaces (left pane, right pane, header, bars, links, grid lines) render with appropriate dark contrast.
  - Consumers can set `GanttOptions.theme?: 'light' | 'dark' | 'system'` to control the mode; the constructor applies the corresponding `data-theme` attribute to the container element.
  - Demo shell (`src/demo/`) includes a theme toggle control for manual testing.
  - No visual regressions at default (light) mode; unit/integration tests verify `data-theme` attribute application.
- **Status**: Fixed (2026-05-06)
- **Notes**:
  - Added `ThemeMode = 'light' | 'dark' | 'system'` type and `theme` option to `GanttOptions`.
  - `#applyTheme()` in the constructor always sets `data-theme` on the container (default `"system"`).
  - Dark tokens cover background, header, stripe, border, grid line, text, selection ring, today marker, row-selected, special-day backgrounds, link color, and bar label color.
  - `prefers-color-scheme` fallback uses `[data-theme="system"]` selector inside `@media (prefers-color-scheme: dark)`.
  - Demo shell theme select applies `data-theme` to `document.documentElement` for page-wide theming; demo-shell.css has matching dark overrides.
  - Regression coverage in `gantt-chart.integration.test.ts` (7 tests): verifies `data-theme` attribute for all three modes plus visual regression checks.

### `gantt-core/M8-visualize-special-days-in-header`
- **Type**: ux-polish
- **Scope**: Add lightweight visual affordance in the timeline header for configured special days (weekend/holiday/custom).
- **Files**: `src/gantt-chart/vanilla/dom/timeHeader.ts`, `src/styles/gantt.css`
- **Acceptance criteria**:
  - Header cells can reflect special-day semantics without reducing label readability.
  - Behavior is consistent with day-body special-day rendering and remains deterministic for date-only inputs.
  - Feature is optional or subtle enough to avoid visual noise at dense zoom levels.

### `gantt-core/C7-add-internationalization-support`
- **Type**: feature
- **Scope**: Canonical i18n/l10n support covering all three dimensions: date format localization, week calculation convention (first day of week + week numbering scheme), and UI string localization (column headers, toolbar, aria labels, tooltips). Replaces the ad-hoc `locale: string` with a structured `ChartLocale` config threaded through the render pipeline.
- **Files**: `src/gantt-chart/locale.ts`, `src/gantt-chart/vanilla/gantt-chart.ts`, `src/gantt-chart/vanilla/dom/timeHeader.ts`, `src/gantt-chart/vanilla/dom/leftPane.ts`, `src/gantt-chart/vanilla/dom/rightPane.ts`, `src/gantt-chart/vanilla/dom/gridColumns.ts`, `src/gantt-chart/vanilla/state.ts`, `src/gantt-chart/domain/dateMath.ts`, `src/gantt-chart/timeline/scale.ts`, `src/gantt-chart/index.ts`, `src/gantt-chart/locale.test.ts`, `src/gantt-chart/domain/dateMath.test.ts`, `src/gantt-chart/vanilla/gantt-chart.integration.test.ts`
- **Acceptance criteria**:

  - **A. `ChartLocale` type (canonical, no backward compat)**:
    - Defined in a new file `src/gantt-chart/locale.ts`.
    - Shape: `{ code: string; labels?: Partial<Record<LocaleLabelKey, string>>; weekStartsOn?: 0 | 1 | 6; weekNumbering?: 'iso' | 'us' | 'simple' }`.
    - `code` is a BCP 47 language tag (e.g. `'en-US'`, `'de-DE'`, `'fr-FR'`). Mandatory for every `ChartLocale`.
    - `LocaleLabelKey` is a union type enumerating every hardcoded UI string key: `'column_task_name'`, `'column_start_time'`, `'column_duration'`, `'toolbar_hour'`, `'toolbar_day'`, `'toolbar_week'`, `'toolbar_month'`, `'toolbar_quarter'`, `'toolbar_year'`, `'add_subtask_title'`, `'aria_task'`, `'aria_milestone'`.
    - `labels` is partial-override only — any missing key falls back to `EN_US_LABELS`.
    - `weekStartsOn` defaults to the locale's convention (derived via `Intl.Locale` → `getWeekInfo` where available; otherwise: `0` for US/CA/MX/JP/IL/SA, `6` for AE/EG/IQ, `1` everywhere else).
    - `weekNumbering` defaults to `'iso'` for Europe/ISO regions, `'us'` otherwise.
    - `EN_US_LABELS` is exported as a `const` satisfying `Record<LocaleLabelKey, string>`.

  - **B. Replace bare `locale: string` entirely**:
    - `GanttOptions.locale` (string, currently `'en-US'`) is removed.
    - Replaced by `GanttOptions.locale: ChartLocale` with the default `CHART_LOCALE_EN_US` constant.
    - `LeftPaneCallbacks.locale: string` is replaced by `locale: ChartLocale`.
    - `GridColumn.format` callback signature changes from `(value, task, row, locale: string)` to `(value, task, row, locale: ChartLocale)`.
    - `renderTimeHeader`, `renderLeftPane`, `renderRightPane` receive `ChartLocale` from `GanttState` (not as a separate parameter).
    - All internal plumbing that threaded `locale` as a bare string is updated.

  - **C. Date formatting uses `Intl.DateTimeFormat` with the locale code**:
    - `formatHeaderLabel`, `formatUpperLabel`, `formatDisplayDate` accept a `ChartLocale` parameter (or derive from it) and use `Intl.DateTimeFormat(locale.code, {…, timeZone: 'UTC'})`.
    - All month/day/weekday names respect the locale across every zoom level.
    - No breaking change to the signature of `formatHeaderLabel`/`formatUpperLabel` consumed externally (these are internal).

  - **D. Week calculation is configurable**:
    - `snapToScaleBoundary('week')` and `startOfWeek()` read `weekStartsOn` from a `ChartLocale` parameter.
    - `isoWeek()` is renamed to `formatWeekNumber(date, weekNumbering)` and moved to `dateMath.ts`. The three schemes:
      - `'iso'`: ISO 8601 (week containing the first Thursday; Monday start).
      - `'us'`: Week containing Jan 1; Sunday start.
      - `'simple'`: `Math.ceil(dayOfYear / 7)`.
    - `weekendDays` option on `GanttOptions` is removed. Weekend days are derived from `weekStartsOn` as the two surrounding days, e.g. Monday start → Sat+Sun, Sunday start → Sat+Sun, Saturday start → Thu+Fri. Consumers needing non-standard weekends override `showWeekends`/`specialDays` instead.

  - **E. Static text is locale-driven**:
    - `DEFAULT_GRID_COLUMNS` is replaced by `gridColumnDefaults(locale: ChartLocale): GridColumn[]` — headers use `locale.labels` lookup with `EN_US_LABELS` fallback.
    - Toolbar scale buttons: `buildToolbar` reads labels from `locale.labels` (no `s.toUpperCase()` hardcoding).
    - `buildAddButton` uses `locale.labels.add_subtask_title` for the `title` attribute.
    - Bar aria labels use parameterized templates from labels (e.g. `'aria_task': 'Task {0}'` with `{0}` replaced).
    - All hardcoded English strings in any DOM template are removed.

  - **F. Visual regression gate**: At `GanttOptions.locale = CHART_LOCALE_EN_US` (default), the rendered output is pixel-identical to current `en-US`.

  - **G. Test coverage**:
    - `dateMath.test.ts`: `formatWeekNumber` for all three numbering schemes and edge cases (year boundary, Jan 1 placement).
    - `timeHeader.test.ts`: Header rendering with `de-DE`, `fr-FR`, and `ar-SA` locales verifying month/day/week labels.
    - `mount.integration.test.ts`: Full-chart mount with `ChartLocale` wiring; label overrides; `weekStartsOn` and `weekNumbering` plumbing verification.
    - `locale.test.ts`: Resolution of `weekStartsOn`/`weekNumbering` defaults from BCP 47 codes (canonical mapping table).

### `gantt-core/U2-complete-zoom-level-support` (done)
- **Type**: feature
- **Scope**: Ensure all zoom levels (`YEAR`, `QUARTER`, `MONTH`, `WEEK`, `DAY`, `HOUR`) are fully supported and switchable.
- **Files**: `src/gantt-chart/timeline/scale.ts`, `src/gantt-chart/vanilla/mount.ts`, `src/gantt-chart/vanilla/types.ts`
- **Acceptance criteria**:
  - Zoom menu options map to implemented timeline scales without no-op/fallback behavior.
  - Switching between all levels updates header cadence and task geometry consistently.
  - Unsupported-level warnings/errors are removed for supported scales.

### `gantt-core/U3-manual-verify-drag-resize-parity` (done)
- **Type**: qa
- **Scope**: Automated parity verification for drag/resize behavior via Playwright e2e test.
- **Files**: `tests/e2e/gantt-chart.e2e-test.ts`
- **Acceptance criteria**:
  - Automated test confirms identical pixel shifts for identical input deltas at all zoom levels.
  - Both interactions use the same `mapper.widthToDuration(dx)` + `Math.round()` conversion — parity is guaranteed by code construction.
  - No follow-up ticket needed.

### `gantt-core/T1-introduce-stylelint-css-linter` (done)
- **Type**: dev-tools
- **Scope**: Introduce stylelint as a CSS linter to enforce consistent CSS coding standards.
- **Files**: `stylelint.config.js`, `package.json`, `src/styles/**/*.css`, `.github/workflows/*`
- **Acceptance criteria**:
  - stylelint is installed as a dev dependency and configured with a project-appropriate ruleset.
  - A `lint:css` script is added to `package.json` and integrated into the `pnpm run ci` pipeline.
  - Existing CSS files pass stylelint without errors (or with documented, intentional exceptions).
  - Linting errors are surfaced during CI and pre-commit hooks.
  - Configuration is documented so contributors understand the CSS conventions enforced.
- **Status**: Fixed (2026-05-06)
- **Notes**:
  - Installed `stylelint` 17.9.1 and `stylelint-config-standard` 40.0.0 as dev dependencies.
  - Created `stylelint.config.js` extending `stylelint-config-standard` with project-specific rules:
    - Tab indentation (via oxfmt; stylelint 17 removed built-in indentation rule).
    - Class selector pattern `^(gantt|demo)-[a-zA-Z0-9_-]+$` enforces prefixed BEM-like naming.
    - Custom property pattern `^(gantt|demo)-[a-z][a-z0-9-]*$` enforces design-token prefixes.
    - `!important` is allowed (used deliberately for hover/state/affordance rules).
    - `color-function-notation: 'legacy'` (project uses `rgba()` syntax).
    - Relaxed rules: `color-hex-length`, `font-family-name-quotes`, `media-feature-range-notation`, `no-descending-specificity` (ignore selectors-within-list), `comment-empty-line-before`, `declaration-empty-line-before`, `rule-empty-line-before`.
    - `color-function-alias-notation` disabled (project uses `rgba` over `rgb`).
  - Renamed non-prefixed classes in `demo-shell.css` to `demo-*` prefix: `.control-row` → `.demo-control-row`, `.control-group` → `.demo-control-group`, `.control-scale-label` → `.demo-control-scale-label`, `.event-panel` → `.demo-event-panel`, `.event-panel__header` → `.demo-event-panel__header`, `.event-panel__log` → `.demo-event-panel__log`. Updated corresponding class references in `index.html`.
  - Added `lint:css` and `lint:css:fix` scripts to `package.json`; `lint:css` is integrated into `pnpm run ci` pipeline and the GitHub Actions CI `/lint` job.
  - `format` script updated to run `stylelint --fix` after `oxfmt`.
  - Pre-commit hook (`pnpm run ci`) automatically gates CSS lint violations.
  - Both existing CSS files (`gantt.css`, `demo-shell.css`) pass stylelint with zero errors.
  - `README.md` Scripts section and `AGENTS.md` Core Commands section updated with CSS lint commands.

### `gantt-core/T3-split-library-and-demo-build` (done)
- **Type**: infrastructure
- **Scope**: Clearly separate the chart library from the demo application and make the library production-ready and publishable. Introduce `tsdown` as the library bundler, restructure the Vite config so the demo is a consumer of the library rather than co-located build output, add `package.json` metadata (`exports`, `main`, `module`, `types`, `files`) so `gantt-chart` is a valid npm package, and integrate TypeDoc API documentation generation as part of the build/deploy pipeline (absorbing `gantt-core/T2`).
- **Files**: `package.json`, `tsdown.config.ts` (new), `vite.config.ts`, `tsconfig.json`, `typedoc.json` (new), `src/gantt-chart/index.ts`, `src/demo/**/*`, `.gitignore`, `.github/workflows/ci.yml`, `README.md`, `CONTRIBUTING.md`, `pnpm-lock.yaml`, `tests/build-regression/lib-build.test.ts` (new)
- **Acceptance criteria**:
  - **A. Library build with tsdown**: `tsdown` is installed as a dev dependency and configured via `tsdown.config.ts` to produce ESM output with `.d.ts` type declarations from `src/gantt-chart/index.ts` as the entry point.
  - **B. package.json is publishable**: `"exports"` map is defined with `"."` pointing to the ESM bundle and `"./styles/gantt.css"` for the stylesheet. `"main"`, `"module"`, and `"types"` fields are populated. `"files"` is set to include only `dist/` (the library build output; not the demo SPA).
  - **C. `pnpm run build:lib` script**: A new script builds only the library via tsdown. The existing `pnpm run build` produces the demo SPA into `dist-demo/`.
  - **D. Demo is a consumer of the library**: The demo app (`src/demo/`) imports the library via the package name (`'gantt-chart'`) with a Vite alias mapping to `src/gantt-chart/` for dev convenience.
  - **E. CSS is distributed with the library**: `gantt.css` is copied to `dist/styles/` during the library build and is accessible via the `"./styles/gantt.css"` export condition.
  - **F. Type declarations are generated**: `tsdown` outputs `.d.mts` files alongside the bundles. `"types"` in `package.json` points to the barrel declaration file.
  - **G. TypeDoc API documentation**: `typedoc` is installed and configured via `typedoc.json`. A `docs:api` script generates HTML API docs from `src/gantt-chart/index.ts` into `docs/api/` (excluded from git via `.gitignore`).
  - **H. CI compatibility**: `pnpm run ci` continues to pass: the library build runs first, then type-check, lint, format-check, demo build, and test all succeed. Build regression test (`test:build`) added to CI.
  - **I. No breaking changes to the public API**: All existing exports from `src/gantt-chart/index.ts` remain available through the library entry point. Existing tests pass without modification.
  - **J. Documentation**: `CONTRIBUTING.md` and `README.md` updated to explain the split (library vs. demo), the available build scripts, the tsdown workflow, and the TypeDoc setup.
- **Status**: Fixed (2026-05-06)
- **Notes**:
  - Installed `tsdown` 0.21.10, `@tsdown/css` 0.21.10, and `typedoc` 0.28.19 as dev dependencies.
  - Created `tsdown.config.ts` with ESM format, `fixedExtension: true`, `.d.ts` generation, and CSS copy to `dist/styles/gantt.css`.
  - Updated `vite.config.ts` to build demo SPA into `dist-demo/` with a `gantt-chart` alias resolving to `src/gantt-chart/`.
  - Updated `tsconfig.json` with `paths` mapping `gantt-chart` to `src/gantt-chart/index.ts`.
  - Added `baseUrl: "."` and `ignoreDeprecations: "6.0"` to tsconfig for TS 6 compatibility.
  - Updated `package.json` with `main`, `module`, `types`, `exports`, and `files` fields. Added `build:lib`, `docs:api`, and `test:build` scripts. Updated `ci` script to build library before demo.
  - Updated `src/demo/init.ts` to import from `'gantt-chart'` (package name) instead of relative path.
  - Created `typedoc.json` excluding tests and demo code.
  - Created `tests/build-regression/lib-build.test.ts` (5 tests) verifying ESM bundle, type declarations, CSS copy, dependency externalization, and package.json publish fields.
  - Created `vitest.node.config.ts` for node-mode build regression tests.
  - Updated `.gitignore` with `dist-demo/` and `docs/api/`.
  - Updated `.github/workflows/ci.yml` test job to run `build:lib` before `build` and added `build-regression` job.
  - Updated `README.md` and `CONTRIBUTING.md` with library consumption docs, build scripts, and tsdown info.

### `gantt-core/T4-add-github-pages-deploy-and-badges`
- **Type**: feature
- **Scope**: Deploy the demo to GitHub Pages and add project badges (NPM, CI, coverage) to the README.
- **Files**: `.github/workflows/ci.yml`, `vitest.config.ts`, `README.md`
- **Solution**:
  1. **Add `deploy` job** to `.github/workflows/ci.yml` after `integration-test`:
      - Trigger: push to `main` only (not PRs).
      - Permissions: `contents: read`, `pages: write`, `id-token: write`.
      - Environment: `github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`.
      - Steps: checkout → setup pnpm/node → `pnpm install --frozen-lockfile` → `pnpm run build -- --base=/gantt-chart/` (base path ensures assets resolve under `https://doberkofler.github.io/gantt-chart/`) → `actions/upload-pages-artifact@v3` with path `dist-demo` → `actions/deploy-pages@v4`.
  2. **Add coveralls coverage upload** to the `test` job in `ci.yml`:
      - Step after `pnpm run test`: `coverallsapp/github-action@v2` to upload coverage results.
  3. **Add `lcov` reporter** to `vitest.config.ts` coverage configuration so coveralls can consume the data.
  4. **Add project badges** to `README.md` (after the `# gantt-chart` title):
      - NPM Version: `[![NPM Version](https://img.shields.io/npm/v/gantt-chart.svg)](https://www.npmjs.com/package/gantt-chart)`
      - NPM Downloads: `[![NPM Downloads](https://img.shields.io/npm/dm/gantt-chart.svg)](https://www.npmjs.com/package/gantt-chart)`
      - License: `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)`
      - CI: `[![Node.js CI](https://github.com/doberkofler/gantt-chart/actions/workflows/ci.yml/badge.svg)](https://github.com/doberkofler/gantt-chart/actions/workflows/ci.yml)`
      - Coverage: `[![Coverage Status](https://coveralls.io/repos/github/doberkofler/gantt-chart/badge.svg?branch=main)](https://coveralls.io/github/doberkofler/gantt-chart?branch=main)`
  5. **Manual step** (after merge): set GitHub Pages source to **GitHub Actions** in repo Settings → Pages.
- **Acceptance criteria**:
  - Demo is deployed and accessible at `https://doberkofler.github.io/gantt-chart/` on every push to main.
  - Asset paths (JS, CSS, images) resolve correctly under the `/gantt-chart/` base path.
  - Local dev (`pnpm run dev`) is unaffected by the base path change.
  - Coverage results are uploaded to coveralls on every CI run.
  - README displays all five badges as a row below the title.
  - `vitest.config.ts` produces `lcov.info` coverage output.
- **Effort**: M

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
| `gantt-core/C1-fix-today-marker-scroll-overshoot` | 2026-05-05 |
| `gantt-core/C2-fix-mobile-timeline-collapse` | 2026-05-05 |
| `gantt-core/C3-provide-task-edit-dialog-api` | 2026-05-05 |
| `gantt-core/C4-add-link-endpoint-controls` | 2026-05-06 |
| `gantt-core/C5-add-special-day-rendering-api` | 2026-05-05 |
| `gantt-core/C6-provide-collapse-expand-all-api` | 2026-05-05 |
| `gantt-core/C7-add-internationalization-support` | 2026-05-06 |
| `gantt-core/U2-complete-zoom-level-support` | 2026-05-05 |
| `gantt-core/U3-manual-verify-drag-resize-parity` | 2026-05-06 |
| `gantt-core/M1-tune-selection-visual-style` | 2026-05-05 |
| `gantt-core/M2-stop-second-click-deselect-toggle` | 2026-05-06 |
| `gantt-core/M3-decouple-link-highlight-from-selection` | 2026-05-05 |
| `gantt-core/M4-align-grid-schema-and-widths` | 2026-05-05 |
| `gantt-core/M5-align-time-header-cadence` | 2026-05-05 |
| `gantt-core/M6-align-density-constants` | 2026-05-05 |
| `gantt-core/M7-rebalance-left-pane-width` | 2026-05-05 |
| `gantt-core/M9-normalize-typography-scale` | 2026-05-05 |
| `gantt-core/M10-align-bar-label-placement` | 2026-05-05 |
| `gantt-core/M11-align-add-affordance-visibility` | 2026-05-05 |
| `gantt-core/M12-align-container-framing` | 2026-05-06 |
| `gantt-core/M13-resize-left-pane-width` | 2026-05-05 |
| `gantt-core/M14-resize-left-pane-columns` | 2026-05-05 |
| `gantt-core/M15-add-dark-mode-support` | 2026-05-06 |
| `gantt-core/T1-introduce-stylelint-css-linter` | 2026-05-06 |
| `gantt-core/T3-split-library-and-demo-build` | 2026-05-06 |
| `gantt-core/T4-add-github-pages-deploy-and-badges` | 2026-05-06 |
