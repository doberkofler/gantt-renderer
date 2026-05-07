# gantt-renderer

[![NPM Version](https://img.shields.io/npm/v/gantt-renderer.svg)](https://www.npmjs.com/package/gantt-renderer)
[![NPM Downloads](https://img.shields.io/npm/dm/gantt-renderer.svg)](https://www.npmjs.com/package/gantt-renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/doberkofler/gantt-renderer/actions/workflows/ci.yml/badge.svg)](https://github.com/doberkofler/gantt-renderer/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/doberkofler/gantt-renderer/badge.svg?branch=main)](https://coveralls.io/github/doberkofler/gantt-renderer?branch=main)

![Gantt chart demo](https://raw.githubusercontent.com/doberkofler/gantt-renderer/main/docs/images/gantt-demo.png)

**[Live Demo →](https://doberkofler.github.io/gantt-renderer/)**
&nbsp;|&nbsp;
**[Usage Guide →](https://github.com/doberkofler/gantt-renderer/blob/main/docs/guide.md)**
&nbsp;|&nbsp;
**[API Docs →](https://doberkofler.github.io/gantt-renderer/docs/api/)**
&nbsp;|&nbsp;
**[Contributing →](https://github.com/doberkofler/gantt-renderer/blob/main/CONTRIBUTING.md)**

A TypeScript Gantt chart renderer for **precalculated project plans**.

This package is focused on visualization and interaction: it renders tasks, timelines, and
dependencies, and provides UX hooks for user actions. It does **not** compute schedules,
optimize timelines, resolve resource constraints, or perform planning logic itself.

## Purpose

- Render already-planned project data in a clear, interactive timeline UI.
- Capture user interactions (select, move, resize, double-click) and hand them back to your app.
- Let your backend or planning engine stay the source of truth for all project calculations.

## Scope

The library is designed as a core chart component (`src/gantt-chart/**/*`) that your product can
embed. Outer-page/demo concerns (export toolbars, fullscreen shell controls, demo-only control
rows) are intentionally outside the core scope.

**Includes:**

- Chart/grid rendering, task bars, timeline header, dependency links.
- Selection, drag/resize UX, and responsive split-pane behavior.
- Tree-based task hierarchy with expand/collapse support.
- Timeline scales: `hour`, `day`, `week`, `month`, `quarter`, `year`.
- Special-day rendering API for weekends, holidays, and custom day semantics in `day` scale.
- Drag and resize interactions with callback hooks.
- Dependency validation and link path routing.
- Input validation with `zod` schemas.
- Unit tests with Vitest and integration tests with Playwright.

**Does not include:**

- Automatic project scheduling.
- Critical path or resource leveling calculations.
- Date recalculation across dependent tasks.
- Business-rule planning decisions.
- Built-in outer toolbars, export implementations, fullscreen shell behavior, demo-only control strips.

Those planning concerns should be handled upstream, then passed into this renderer as `GanttInput`.

## Quick Start

```bash
npm install gantt-renderer
```

```ts
import {GanttChart, parseGanttInput} from 'gantt-renderer';
import 'gantt-renderer/styles/gantt.css';

const input = parseGanttInput(yourData);
const instance = new GanttChart(document.getElementById('chart')!, input, {
	scale: 'day',
});
```

## Integration Pattern

1. Compute/plan project data in your domain layer or backend.
2. Validate the result with `parseGanttInput(yourData)`.
3. Render with `new GanttChart(container, input, options)` and react to interaction callbacks.
4. Persist user edits through your own business logic, then update with `instance.update(newInput)`.

## Package Exports

- **`gantt-renderer`** — ESM bundle with all types and utilities.
- **`gantt-renderer/styles/gantt.css`** — Core chart stylesheet.

## Further Reading

- **[Usage Guide](https://github.com/doberkofler/gantt-renderer/blob/main/docs/guide.md)** — All constructor options: locale, theme, grid schema, CSS tokens,
  link creation, special days, density constants, and more.
- **[API Documentation](https://doberkofler.github.io/gantt-renderer/docs/api/)** — TypeDoc-generated
  API reference.
- **[Contributing](https://github.com/doberkofler/gantt-renderer/blob/main/CONTRIBUTING.md)** — Dev setup, scripts, demo verification, and code conventions.
