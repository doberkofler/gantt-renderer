# Contributing

See the [README](./README.md) for library usage. This file covers repository development.

## Dev Setup

```bash
pnpm install
pnpm run dev
```

Open the local Vite URL shown in the terminal to view the demo.

## Scripts

- `pnpm run dev` - Start the Vite development server.
- `pnpm run build` - Build demo SPA assets into `dist-demo/`.
- `pnpm run build:lib` - Build the library (ESM + `.d.ts` + CSS) into `dist/`.
- `pnpm run preview` - Preview the demo build locally.
- `pnpm run typecheck` - Run TypeScript type checks.
- `pnpm run lint` - Run oxlint.
- `pnpm run lint:css` - Run stylelint on CSS files.
- `pnpm run lint:css:fix` - Autofix CSS lint violations where possible.
- `pnpm run format` - Format code with oxfmt and autofix CSS with stylelint.
- `pnpm run format:check` - Verify formatting.
- `pnpm run test` - Run unit tests with Vitest (browser mode).
- `pnpm run test:build` - Run build regression tests verifying library output.
- `pnpm run integration-test` - Run Playwright integration tests.
- `pnpm run docs:api` - Generate TypeDoc API documentation into `docs/api/`.
- `pnpm run ci` - Run typecheck, lint, format check, library build, demo build, and tests.

## Demo Verification

Use this quick scenario when validating the demo behavior on a hosted page (for example GitHub Pages):

1. Open the page and confirm `Event Log` starts with `demo initialized`.
2. In `Scale`, switch `Days -> Months -> Years`; verify each change is reflected in the selector and logged as `scale-select | integrated`.
3. Click `Zoom Out` until `Years`, then `Zoom In` until `Hours`; verify the selected scale updates each step.
4. Click `Collapse All` and confirm child rows hide, then click `Expand All` and confirm rows return.
5. Click `Fullscreen`, then press `Escape`; verify the button label toggles and fullscreen state changes are logged.

Expected result: all controls are interactive, placeholder actions are clearly signaled, and every control action appends a timestamped line in `Event Log`.

## Development Notes

- The project uses ESM and strict TypeScript.
- The library is built with [tsdown](https://tsdown.dev) (powered by Rolldown) into `dist/`.
- The demo app is built with Vite into `dist-demo/`.
- TypeScript formatting and linting are handled with the Oxc toolchain (`oxfmt` and `oxlint`).
- CSS linting is handled with `stylelint` and `stylelint-config-standard`.
- Commit messages follow Conventional Commits.
- API documentation is generated with [TypeDoc](https://typedoc.org) (`pnpm run docs:api`).

## CSS Linting

CSS files are linted with [stylelint](https://stylelint.io/) using `stylelint-config-standard`
as the base ruleset. The project-specific configuration is in `stylelint.config.js`.

### Conventions

| Rule | Value | Notes |
|------|-------|-------|
| Indentation | Tabs | Enforced by `oxfmt`; stylelint 17 removed built-in indentation |
| Selector class naming | `^(gantt\|demo)-[a-zA-Z0-9_-]+$` | All CSS classes must use `gantt-` (core chart) or `demo-` (demo shell) prefix |
| Custom property naming | `^(gantt\|demo)-[a-z][a-z0-9-]*$` | Design tokens use prefixed kebab-case |
| `!important` | Allowed | Used deliberately for hover/state/affordance rules |
| Colour functions | `legacy` notation (`rgba()`) | Project consistently uses `rgba()` for alpha colours |

### Commands

- `pnpm run lint:css` — Lint all CSS files.
- `pnpm run lint:css:fix` — Autofix where possible.
- `pnpm run format` — Runs `oxfmt --write` followed by `stylelint --fix`.
