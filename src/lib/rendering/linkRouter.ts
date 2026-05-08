import {type Link, type LinkType} from '../validation/schemas.ts';
import {type BarLayout} from '../timeline/layoutEngine.ts';
import {MILESTONE_HALF} from '../timeline/layoutEngine.ts';

export type Point = {x: number; y: number};

export type RoutedLink = {
	linkId: number;
	sourceTaskId: number;
	targetTaskId: number;
	type: LinkType;
	/** Ordered vertices of the orthogonal polyline (source → target). */
	points: Point[];
};

/** px gap before/after bar for routing clearance and arrow approach */
const TURN_MARGIN = 24;

/** px vertical offset below the bar row for same-row loop detours */
const SAME_ROW_DETOUR = 24;

/** Segments shorter than this (px) are collapsed before stroking */
const STUB_THRESHOLD = 2;

/**
 * Removes consecutive points whose Euclidean distance is below {@link STUB_THRESHOLD}.
 * The first point is always kept.  This prevents near‑zero‑length segments from
 * appearing as visible stubs near the arrowhead.
 *
 * @param points - The ordered vertex list.
 * @returns A filtered copy, guaranteed to contain at least the first point.
 */
function collapseStubs(points: Point[]): Point[] {
	const out: Point[] = [];
	for (const pt of points) {
		const last = out.at(-1);
		if (last === undefined || Math.hypot(pt.x - last.x, pt.y - last.y) >= STUB_THRESHOLD) {
			out.push(pt);
		}
	}
	return out;
}

// ─── Anchor point helpers ────────────────────────────────────────────────────────

/**
 * True when the dependency arrow enters the target on its **left** edge (FS, SS).
 * False when the arrow enters on the target's **right** edge (FF, SF).
 *
 * The arrowhead uses SVG `orient="auto"` so it rotates to match the direction
 * of the **last** path segment. Therefore:
 *
 *   - Left-entry  → last segment must travel **RIGHT**   (penultimate.x < tx).
 *   - Right-entry → last segment must travel **LEFT**    (penultimate.x > tx).
 *
 * @param type - The link type.
 * @returns `true` for FS / SS, `false` for FF / SF.
 */
function isLeftEntry(type: Link['type']): boolean {
	return type === 'FS' || type === 'SS';
}

/**
 * True when the link exits the source bar on its **right** edge (FS, FF).
 * False when it exits on the **left** edge (SS, SF).
 *
 * The first step after the source anchor should move **away** from the bar,
 * **not** into it.  This means:
 *
 *   - Exit‑right → first horizontal segment goes RIGHT  (+TURN_MARGIN).
 *   - Exit‑left  → first horizontal segment goes LEFT   (-TURN_MARGIN).
 *
 * @param type - The link type.
 * @returns `true` for FS / FF, `false` for SS / SF.
 */
function isExitRight(type: Link['type']): boolean {
	return type === 'FS' || type === 'FF';
}

/**
 * Computes anchor points for the given link type.
 *
 * | Type | Source anchor (`sx`)        | Target anchor (`tx`)          |
 * |------|-----------------------------|-------------------------------|
 * | FS   | right edge of source        | left edge of target           |
 * | SS   | left edge of source         | left edge of target           |
 * | FF   | right edge of source        | right edge of target          |
 * | SF   | left edge of source         | right edge of target          |
 *
 * Milestone offsets are applied automatically: ± {@link MILESTONE_HALF} replaces
 * ± width for zero‑width milestones.
 *
 * @param type - The link type determining start/end anchor points.
 * @param src  - The source bar layout.
 * @param tgt  - The target bar layout.
 * @returns Anchor x coordinates `{sx, tx}`.
 * @throws {Error} if the link type is not handled (exhaustiveness guard).
 */
function getAnchors(type: Link['type'], src: BarLayout, tgt: BarLayout): {sx: number; tx: number} {
	const srcRight = src.kind === 'milestone' ? src.x + MILESTONE_HALF : src.x + src.width;
	const srcLeft = src.kind === 'milestone' ? src.x - MILESTONE_HALF : src.x;
	const tgtRight = tgt.kind === 'milestone' ? tgt.x + MILESTONE_HALF : tgt.x + tgt.width;
	const tgtLeft = tgt.kind === 'milestone' ? tgt.x - MILESTONE_HALF : tgt.x;

	switch (type) {
		case 'FS': {
			return {sx: srcRight, tx: tgtLeft};
		}
		case 'SS': {
			return {sx: srcLeft, tx: tgtLeft};
		}
		case 'FF': {
			return {sx: srcRight, tx: tgtRight};
		}
		case 'SF': {
			return {sx: srcLeft, tx: tgtRight};
		}
		default: {
			const _exhaustive: never = type;
			throw new Error(`Unhandled link type: ${String(_exhaustive)}`);
		}
	}
}

// ─── Same-row routing ────────────────────────────────────────────────────────────

/**
 * Routes a link whose source and target rows are within 1 px of each other.
 *
 * **Direct‑line optimisation**
 * A plain horizontal segment is only used when it is non‑degenerate (`sx ≠ tx`)
 * AND the arrowhead direction is visually correct:
 *
 * | Entry side | Condition  | Arrow direction |
 * |-----------|-----------|----------------|
 * | left      | `sx < tx` | → RIGHT ✓       |
 * | right     | `sx > tx` | ← LEFT ✓        |
 *
 * Otherwise a 6‑vertex detour is drawn so that the last segment approaches
 * the target from the correct side. By default the detour goes **below** the
 * bars; pass `above = true` when headroom is insufficient below.
 *
 * @param sx - Source anchor x.
 * @param sy - Source row center y.
 * @param tx - Target anchor x.
 * @param ty - Target row center y.
 * @param leftEntry - Whether the link enters the target on its left edge.
 * @param exitRight - Whether the link exits the source on its right edge.
 * @param above - Route the detour above the bar row instead of below (default `false`).
 * @returns An ordered array of {@link Point} vertices.
 */
function routeSameRow(sx: number, sy: number, tx: number, ty: number, leftEntry: boolean, exitRight: boolean, above = false): Point[] {
	// Direct horizontal line when non‑degenerate and arrow direction is correct
	if (Math.abs(sx - tx) >= STUB_THRESHOLD) {
		const directOk = (leftEntry && sx < tx) || (!leftEntry && sx > tx);
		if (directOk) {
			return [
				{x: sx, y: sy},
				{x: tx, y: ty},
			];
		}
	}

	// ── Loop detour ──
	//
	// The path steps away from the source edge, drops to the detour level,
	// crosses horizontally to an approach point on the correct side of the
	// target, then returns to the target entry point.
	//
	//           left‑entry approach          right‑entry approach
	//           ──────────────────          ────────────────────
	//   anchor   sx    →    tx                sx    →    tx
	//   exit     +dir                  exit   +dir
	//           │ │ │ │ │ │ │ │              │ │ │ │ │ │ │ │
	//           ▼ │ │ │ │ │ │ │              ▼ │ │ │ │ │ │ │
	//         ┌──┐│ │ │ │ │ │ │            ┌──┐│ │ │ │ │ │ │
	//         │  ││ │ │ │ │ │ │            │  ││ │ │ │ │ │ │ (bar row)
	//         │▐▌││ │ │ │ │ │ │            │▐▌││ │ │ │ │ │ │
	//         └──┘│ │ │ │ │ │ │            └──┘│ │ │ │ │ │ │
	//            │ │ │ │ │ │ │               │ │ │ │ │ │ │
	//   detour ══╪═╪═╪═╪══════►              ════════════╪═╪═╪═►
	//            │ │ │ │ │ │ │               │ │ │ │ │ │ │
	//            │ │ │ │ │ ▼ ►               │ │ │ │ │ │ ▼
	//            │ │ │ │ └──┐│               │ │ │ │ │ └──┐
	//            │ │ │ │ │▐▌│               │ │ │ │ │ │▐▌│ (target)
	//            │ │ │ │ └──┘│               │ │ │ │ │ └──┘
	//
	//   points    6                          6
	//   approach  tx - TURN_MARGIN            tx + TURN_MARGIN
	//   last seg  → RIGHT                    → LEFT

	const exitDir = exitRight ? TURN_MARGIN : -TURN_MARGIN;
	const detourY = sy + (above ? -SAME_ROW_DETOUR : SAME_ROW_DETOUR);
	const approachX = leftEntry ? tx - TURN_MARGIN : tx + TURN_MARGIN;

	return [
		{x: sx, y: sy},
		{x: sx + exitDir, y: sy},
		{x: sx + exitDir, y: detourY},
		{x: approachX, y: detourY},
		{x: approachX, y: ty},
		{x: tx, y: ty},
	];
}

// ─── Multi-row routing ───────────────────────────────────────────────────────────

/**
 * Routes a link between **different** rows using an orthogonal path.
 *
 *   1. Step **away** from the source bar to the crossover x (`crossX`).
 *   2. Travel **vertically** to the midpoint between rows (`midY`).
 *   3. Travel **horizontally** to the approach point on the correct side
 *      of the target.
 *   4. Travel **vertically** to the target row (`ty`).
 *   5. Final segment to the target entry point (`tx`).
 *
 * The crossover x is clamped so the path never doubles back past both bars.
 * When exit and entry are on the **same** side (SS / FF) the exit-side step
 * is limited to the approach x, avoiding a wide U‑shape.
 *
 * The approach point is chosen so the last segment travels in the arrow
 * direction demanded by the entry side:
 *
 *   - Left‑entry  (FS, SS): approach from the **left**  → `tx - TURN_MARGIN`
 *     Last segment goes RIGHT.
 *   - Right‑entry (FF, SF): approach from the **right** → `tx + TURN_MARGIN`
 *     Last segment goes LEFT.
 *
 *         left‑entry (FS / SS)              right‑entry (FF / SF)
 *         ─────────────────────              ─────────────────────
 *   sx  ●────────────────►              sx  ●────────────────►
 *        exitDir                             exitDir
 *        │                                    │
 *        │  midY                              │  midY
 *        ▼  ════════════════════►             ▼  ════════════════════►
 *                                │                                   │
 *                                │                                   │
 *                                ▼  approachFromLeft                 ▼  approachFromRight
 *                              ●────────────────►                 ◄────────────────●
 *                              tx                                   tx
 *
 * @param sx - Source anchor x.
 * @param sy - Source row center y.
 * @param tx - Target anchor x.
 * @param ty - Target row center y.
 * @param leftEntry - Whether the link enters the target on its left edge.
 * @param exitRight - Whether the link exits the source on its right edge.
 * @returns An ordered array of {@link Point} vertices.
 */
function routeMultiRow(sx: number, sy: number, tx: number, ty: number, leftEntry: boolean, exitRight: boolean): Point[] {
	const midY = (sy + ty) / 2;
	const approachX = leftEntry ? tx - TURN_MARGIN : tx + TURN_MARGIN;
	const crossX = exitRight ? Math.max(sx + TURN_MARGIN, approachX) : Math.min(sx - TURN_MARGIN, approachX);

	return [
		{x: sx, y: sy},
		{x: crossX, y: sy},
		{x: crossX, y: midY},
		{x: approachX, y: midY},
		{x: approachX, y: ty},
		{x: tx, y: ty},
	];
}

// ─── Entry point ─────────────────────────────────────────────────────────────────

/**
 * Produces the vertex list for an orthogonal connector between source and target.
 *
 * ## Anchor points (sx / tx)
 *
 * | Type | Source anchor (`sx`)        | Target anchor (`tx`)          |
 * |------|-----------------------------|-------------------------------|
 * | FS   | right edge of source        | left edge of target           |
 * | SS   | left edge of source         | left edge of target           |
 * | FF   | right edge of source        | right edge of target          |
 * | SF   | left edge of source         | right edge of target          |
 *
 * Milestone offsets are applied automatically: ± {@link MILESTONE_HALF} replaces
 * ± width for zero‑width milestones.
 *
 * ## Routing strategy
 *
 * **Same row** (|sy − ty| < 1 px):
 * - Direct horizontal line when non‑degenerate **and** the arrow direction
 *   naturally points **into** the target (see {@link routeSameRow}).
 * - Otherwise a 6‑vertex detour below the bars is drawn.
 *
 * **Different rows**: always a 6‑vertex orthogonal path that steps away from
 * the source, passes through the midpoint between rows, and approaches the
 * target from the correct side (see {@link routeMultiRow}).
 *
 * ## Arrowhead direction guarantee
 *
 * The SVG `marker-end` uses `orient="auto"`, so the arrow rotates to match
 * the last segment. This function ensures the last segment always travels
 * **into** the target on the semantically correct edge:
 *
 * | Entry side | Target edge  | Last segment direction |
 * |-----------|-------------|-----------------------|
 * | left      | left edge    | → RIGHT               |
 * | right     | right edge   | ← LEFT                |
 *
 * @param type - The link type determining start/end anchor points.
 * @param src  - The source bar layout.
 * @param tgt  - The target bar layout.
 * @returns An ordered array of {@link Point} vertices.
 */
function route(type: Link['type'], src: BarLayout, tgt: BarLayout): Point[] {
	const {sx, tx} = getAnchors(type, src, tgt);
	const sy = src.centerY;
	const ty = tgt.centerY;

	const leftEntry = isLeftEntry(type);
	const exitRight = isExitRight(type);

	const raw = Math.abs(sy - ty) < 1 ? routeSameRow(sx, sy, tx, ty, leftEntry, exitRight) : routeMultiRow(sx, sy, tx, ty, leftEntry, exitRight);

	return collapseStubs(raw);
}

// ─── Public API ──────────────────────────────────────────────────────────────────

/**
 * Computes orthogonal routing for all dependency links.
 * Links whose source or target is not in the layout map are skipped silently
 * (e.g. when the row is collapsed).
 *
 * @param links   - The dependency links to route.
 * @param layouts - A map from task ID to its computed {@link BarLayout}.
 * @returns An array of {@link RoutedLink} objects with computed vertex paths.
 */
export function routeLinks(links: Link[], layouts: Map<number, BarLayout>): RoutedLink[] {
	return links
		.map((link) => {
			const src = layouts.get(link.source);
			const tgt = layouts.get(link.target);
			if (src === undefined || tgt === undefined) {
				return null;
			}
			return {
				linkId: link.id,
				sourceTaskId: link.source,
				targetTaskId: link.target,
				type: link.type,
				points: route(link.type, src, tgt),
			};
		})
		.filter((r): r is RoutedLink => r !== null);
}
