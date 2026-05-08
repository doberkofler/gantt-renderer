# Agent Guidelines: gantt-renderer

This document provides essential information for AI agents and developers working in this repository. Rigorously adhere to these instructions to maintain consistency and quality.

## Build, Lint, and Test Commands

The project uses `pnpm` as the package manager and `vite` for development/build.

### Mandatory Validation After Code Changes

- After making code changes, always run `pnpm run ci` and `pnpm run integration-test` before considering the task complete.
- A task is complete only when both commands finish successfully with no errors and no warnings.

### Core Commands

- **Install Dependencies:** `pnpm install`
- **Dev Server:** `pnpm run dev`
- **Build Project:** `pnpm run build` (Vite production build)
- **Preview Build:** `pnpm run preview`
- **Type Check:** `pnpm run typecheck` (`tsc --noEmit`)
- **Lint Codebase:** `pnpm run lint` (`oxlint`)
- **Lint CSS:** `pnpm run lint:css` (`stylelint`)
- **Fix CSS:** `pnpm run lint:css:fix` (`stylelint --fix`)
- **Format Code:** `pnpm run format` (`oxfmt --write` + `stylelint --fix`)
- **Format Check:** `pnpm run format:check` (`oxfmt --check`)
- **Run All Tests:** `pnpm run test` (`vitest run`)
- **CI Pipeline:** `pnpm run ci` (typecheck, lint, CSS lint, format check, build, test)

### Running Specific Tests

To run a single test file or tests matching a pattern:

- `pnpm exec vitest <file-path>`
- `npx vitest <file-path>`
  Example: `pnpm exec vitest src/index.test.ts`

To run tests in watch mode:

- `pnpm run test:ui`
- `pnpm exec vitest`

### Debugging

- Use the `debug` library for logging. Import it as `import debug from 'debug';`.
- Configure debug namespaces in your code for selective logging.

## Code Style Guidelines

### Formatting and Structure

- **Indentation:** Use **Tabs** for indentation. Do not use spaces.
- **Line Length:** Aim for a maximum of 100-120 characters per line.
- **Quotes:** Use **single quotes** (`'`) for strings. Use backticks (`` ` ``) for template literals.
- **Semicolons:** Always use semicolons at the end of statements.
- **Trailing Commas:** Use trailing commas in multi-line objects, arrays, and function parameters.

### TypeScript and Types

- **Strict Mode:** The project uses strict TypeScript. Avoid using `any`. Use `unknown` if the type is truly unknown and narrow it.
- **Interfaces vs. Types:**
  - Use `interface` for defining object shapes that might be extended.
  - Use `type` for unions, intersections, and primitives.
- **Naming Conventions:**
  - **Classes/Interfaces/Types:** `PascalCase`
  - **Variables/Functions/Methods:** `camelCase`
  - **Constants:** `SCREAMING_SNAKE_CASE`
  - **Private Members:** Prefix with `#` (native private) or `_` if following older patterns (prefer native private).
- **Unused Variables:** Prefix unused function arguments with an underscore (e.g., `(_arg1, arg2) => ...`) to satisfy linting rules.

### Imports and Exports

- **ESM:** Use standard ESM `import` and `export` syntax.
- **File Extensions:** Always include file extensions in imports if required by the environment (though `tsdown` and `vitest` handle this, follow local conventions).
- **Organization:** Group imports by:
  1. External libraries (e.g., `import { ... } from 'vitest'`)
  2. Internal absolute paths (if configured)
  3. Internal relative paths (e.g., `import { ... } from './utils'`)

### Error Handling

- **Try/Catch:** Use `try/catch` blocks for operations that are expected to fail (network requests, file system access).
- **Custom Errors:** Create custom error classes extending `Error` for domain-specific errors.
- **Validation:** Use guard clauses to handle invalid inputs early in functions.

### Testing Strategy

- **Framework:** `vitest`
- **Style:** Use `test` or `it` blocks with `expect` assertions.
- **Coverage:** Aim for high coverage of business logic. Coverage reports are generated in the `coverage/` directory.
- **Mocks:** Use `vi.mock()` and `vi.fn()` for dependency injection and mocking external modules.

## Git and Contribution Workflow

### Commit Messages

The project enforces [Conventional Commits](https://www.conventionalcommits.org/).

- **Format:** `<type>(<scope>): <description>`
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Pre-commit Hooks:** Husky is used to run linting and commit message validation before commits.

### Branching

- Use descriptive branch names like `feat/add-gantt-view` or `fix/issue-123`.

## Project Specifics

### Linting with Oxlint

The project uses `oxlint` for fast linting. Configuration is located in `oxlint.config.ts`.

- It includes plugins for `unicorn`, `typescript`, `oxc`, `import`, `react`, `jsdoc`, `promise`, and `vitest`.
- Correctness rules are enforced as errors.

### Build Tooling

- `vite` is used for transpilation, bundling, and local development.
- `vitest` is used for unit tests and `playwright` for integration tests.

### Continuous Integration

The `pnpm run ci` command is the source of truth for repository health. Always ensure this command passes before submitting changes.

## Quality Guardrails

- It is not allowed to change, disable, weaken, or bypass any rule, threshold, hook, lint setting, formatter check, test gate, CI validation, or other quality-related configuration without explicit justification.
- If such a change is believed to be necessary, the agent/developer must:
  1. Clearly state what is being changed and why it is needed.
  2. Describe the quality impact and alternatives considered.
  3. Wait for explicit user approval before making the change.

## Core Change Testing Requirement

- Every core chart change (`src/lib/**/*`) must be paired with appropriate automated test coverage.
- Add or update unit tests and/or integration tests based on the change scope.
- Do not consider core work complete unless the related tests are included and passing.

## File Header and Documentation

- Avoid unnecessary file headers or license blocks unless explicitly requested.
- Use JSDoc comments for public-facing APIs and complex functions. Document parameters and return types if they aren't obvious from TypeScript.

## Rules from External Tools

(No rules found in .cursorrules, .cursor/rules/, or .github/copilot-instructions.md)

---

_This file is intended for agentic use. If you are an AI, please update this file if you discover new patterns or requirements while working on the codebase._
