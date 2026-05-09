# [0.5.0](https://github.com/doberkofler/gantt-renderer/compare/v0.4.0...v0.5.0) (2026-05-09)


### Features

* add newEndDate to onTaskMove and newStartDate/newEndDate to onTaskResize callbacks ([e5fc91e](https://github.com/doberkofler/gantt-renderer/commit/e5fc91e6200c76b27db8c09aa1821765105317fa))

# [0.4.0](https://github.com/doberkofler/gantt-renderer/compare/v0.2.0...v0.4.0) (2026-05-09)


### Bug Fixes

* correct link routing geometry and dependency layer rendering ([d00de8a](https://github.com/doberkofler/gantt-renderer/commit/d00de8a8b51d69b7b50ec4c6bf0ce6dd3657e1a8))
* improve lint rules ([1644377](https://github.com/doberkofler/gantt-renderer/commit/1644377da0294838a77386ac4d74832c289fcbfb))
* **interaction:** deep-clone input in update() to prevent drag mutations leaking to consumer data ([ce814a0](https://github.com/doberkofler/gantt-renderer/commit/ce814a02bb87230108635ae663f165497f522f7e)), closes [#patchTask](https://github.com/doberkofler/gantt-renderer/issues/patchTask)
* prevent spurious onTaskMove callback on double-click in timeline ([14976d0](https://github.com/doberkofler/gantt-renderer/commit/14976d0ca8e17bf0b47b34a91e184513e316e811))
* **rendering:** offset multi-row link midpoint to avoid bar center slicing ([1fe09fa](https://github.com/doberkofler/gantt-renderer/commit/1fe09fa3d736cf948035c4f1619f398fa374464d))


### Features

* add custom tooltip support with onTooltipText callback ([eacc7a8](https://github.com/doberkofler/gantt-renderer/commit/eacc7a845d346f007b4c7ad5a9ed901f9d2e8d60))
* add readonly support for tasks and links ([48cd946](https://github.com/doberkofler/gantt-renderer/commit/48cd946fe0b22bbcba18cb6b8e04d62d285300a0))
* **interaction:** add progress bar drag with progressDragEnabled option ([77833b5](https://github.com/doberkofler/gantt-renderer/commit/77833b50b5984158bd9a2ab3ddcc744d05ccb18f))

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
