# [0.2.0](https://github.com/doberkofler/gantt-renderer/compare/v0.1.3...v0.2.0) (2026-05-07)


* refactor(domain)!: rename duration to durationHours (days → hours) ([eb7a554](https://github.com/doberkofler/gantt-renderer/commit/eb7a5549e38ac3e36bb6ee47b66433e67ea9d78f))


### Bug Fixes

* **api:** type parseGanttInput parameter as GanttInputRaw instead of unknown ([d12d96b](https://github.com/doberkofler/gantt-renderer/commit/d12d96b838b0670a668d313efc61bd02c55efa36))
* **rightPane:** offset absoluteLayer below timeline header to align bars with grid rows ([25f2785](https://github.com/doberkofler/gantt-renderer/commit/25f278561b4a789f0daf633436f6c95f4bae5ec9))


### BREAKING CHANGES

* Task duration field renamed from `duration` (days) to
`durationHours` (hours). Durations are now integer hours; `0` = milestone.
Added addHours/diffHours to dateMath. PixelMapper, layoutEngine, drag
interactions, demo data, and all test fixtures updated accordingly.

## [0.1.3](https://github.com/doberkofler/gantt-renderer/compare/v0.1.2...v0.1.3) (2026-05-07)


### Features

* **demo:** add locale selector to demo control panel ([c45a353](https://github.com/doberkofler/gantt-renderer/commit/c45a353248fea61d9d498eca73ae9088dcb608c5))
* **gantt-chart:** add special-day indicator dots to timeline header cells ([6570ddb](https://github.com/doberkofler/gantt-renderer/commit/6570ddb77f72b66adfe368de0a1b922a7e007035))

## [0.1.2](https://github.com/doberkofler/gantt-renderer/compare/v0.1.1...v0.1.2) (2026-05-07)


### Bug Fixes

* improve the documentation ([948cbf6](https://github.com/doberkofler/gantt-renderer/commit/948cbf62e25272116eea54ef03bf5d5ef522cfe8))

## [0.1.1](https://github.com/doberkofler/gantt-renderer/compare/v0.1.0...v0.1.1) (2026-05-07)


### Bug Fixes

* improve the documentation ([98895eb](https://github.com/doberkofler/gantt-renderer/commit/98895eb57259064fe8b2a6022ea03758e3319df0))
* improve the documentation ([8b50d7b](https://github.com/doberkofler/gantt-renderer/commit/8b50d7b626fa9e3fa1869b955bd583403ee1ba35))

# 0.1.0 (2026-05-06)
