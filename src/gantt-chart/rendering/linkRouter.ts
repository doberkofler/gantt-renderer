import {type Link} from '../validation/schemas.ts';
import {type BarLayout} from '../timeline/layoutEngine.ts';
import {MILESTONE_HALF} from '../timeline/layoutEngine.ts';

export type Point = {x: number; y: number};

export type RoutedLink = {
	linkId: number;
	sourceTaskId: number;
	targetTaskId: number;
	/** Ordered vertices of the orthogonal polyline (source → target). */
	points: Point[];
};

const TURN_MARGIN = 12; // px gap before/after bar for routing clearance

/**
 * Produces the vertex list for an orthogonal connector between src and tgt.
 *
 * Link semantics:
 *   FS = source.finish → target.start  (most common)
 *   SS = source.start  → target.start
 *   FF = source.finish → target.finish
 *   SF = source.start  → target.finish
 *
 * @param type - The link type determining start/end anchor points.
 * @param src - The source bar layout.
 * @param tgt - The target bar layout.
 * @returns An ordered array of `Point` vertices.
 */
function route(type: Link['type'], src: BarLayout, tgt: BarLayout): Point[] {
	let sx: number, tx: number;
	const sy = src.centerY;
	const ty = tgt.centerY;

	switch (type) {
		case 'FS': {
			sx = src.type === 'milestone' ? src.x + MILESTONE_HALF : src.x + src.width;
			tx = tgt.type === 'milestone' ? tgt.x - MILESTONE_HALF : tgt.x;
			break;
		}
		case 'SS': {
			sx = src.type === 'milestone' ? src.x - MILESTONE_HALF : src.x;
			tx = tgt.type === 'milestone' ? tgt.x - MILESTONE_HALF : tgt.x;
			break;
		}
		case 'FF': {
			sx = src.type === 'milestone' ? src.x + MILESTONE_HALF : src.x + src.width;
			tx = tgt.type === 'milestone' ? tgt.x + MILESTONE_HALF : tgt.x + tgt.width;
			break;
		}
		case 'SF': {
			sx = src.type === 'milestone' ? src.x - MILESTONE_HALF : src.x;
			tx = tgt.type === 'milestone' ? tgt.x + MILESTONE_HALF : tgt.x + tgt.width;
			break;
		}
	}

	// Same row: direct horizontal
	if (Math.abs(sy - ty) < 1) {
		return [
			{x: sx, y: sy},
			{x: tx, y: ty},
		];
	}

	// Forward path: midpoint between sx and tx
	if (sx <= tx) {
		const midX = sx + Math.max(TURN_MARGIN, (tx - sx) / 2);
		return [
			{x: sx, y: sy},
			{x: midX, y: sy},
			{x: midX, y: ty},
			{x: tx, y: ty},
		];
	}

	// Backward path: loop around via margins
	const loopX = tx - TURN_MARGIN;
	return [
		{x: sx, y: sy},
		{x: sx + TURN_MARGIN, y: sy},
		{x: sx + TURN_MARGIN, y: (sy + ty) / 2},
		{x: loopX, y: (sy + ty) / 2},
		{x: loopX, y: ty},
		{x: tx, y: ty},
	];
}

/**
 * Computes orthogonal routing for all dependency links.
 * Links whose source or target is not in the layout map are skipped silently
 * (e.g. when the row is collapsed).
 *
 * @param links - The dependency links to route.
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
				points: route(link.type, src, tgt),
			};
		})
		.filter((r): r is RoutedLink => r !== null);
}
