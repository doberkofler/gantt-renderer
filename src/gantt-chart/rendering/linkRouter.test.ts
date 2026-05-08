import {describe, expect, it} from 'vitest';
import {routeLinks, type Point} from './linkRouter.ts';
import {type BarLayout} from '../timeline/layoutEngine.ts';
import {type Link} from '../validation/schemas.ts';

function bar(taskId: number, x: number, y: number, width: number, type: 'task' | 'project' | 'milestone' = 'task'): BarLayout {
	return {
		taskId,
		x,
		y,
		width,
		height: 28,
		progressWidth: 0,
		type,
		rowIndex: 0,
		centerX: type === 'milestone' ? x : x + width / 2,
		centerY: y,
	};
}

/** Direction of the last segment: 1 = right, -1 = left, 0 = vertical / degenerate */
function lastSegmentDir(points: Point[]): number {
	const [prev, last] = [points.at(-2), points.at(-1)];
	if (prev === undefined || last === undefined) {
		return 0;
	}
	return Math.sign(last.x - prev.x);
}

/** Direction of the first segment: 1 = right, -1 = left, 0 = vertical / degenerate */
function firstSegmentDir(points: Point[]): number {
	const [first, next] = [points[0], points[1]];
	if (first === undefined || next === undefined) {
		return 0;
	}
	return Math.sign(next.x - first.x);
}

/** Extracts the routed points or throws if the link was skipped */
function pts(routed: ReturnType<typeof routeLinks>, index = 0): Point[] {
	const link = routed[index];
	if (link === undefined) {
		throw new Error(`expected routed link at index ${index}`);
	}
	return link.points;
}

describe('linkRouter utilities', () => {
	it('skips links missing source or target layout', () => {
		const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
		const layouts = new Map<number, BarLayout>([[1, bar(1, 0, 20, 100)]]);
		expect(routeLinks(links, layouts)).toEqual([]);
	});

	describe('same-row routing', () => {
		it('FS with source-left-of-target uses direct segment (rightward arrow)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(2);
			expect(p[0]).toEqual({x: 100, y: 20});
			expect(p[1]).toEqual({x: 180, y: 20});
			expect(lastSegmentDir(p)).toBe(1); // arrow → RIGHT
		});

		it('FS zero-gap (sx === tx) uses loop instead of degenerate path', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 100, 20, 80)], // starts exactly where source ends
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6); // loop, not degenerate
			expect(p[0]?.x).toBe(100); // anchor at right edge
			expect(lastSegmentDir(p)).toBe(1); // arrow → RIGHT
		});

		it('FS source-right-of-target uses loop (rightward entry)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 200, 20, 100)], // source to the right
				[2, bar(2, 0, 20, 80)], // target to the left
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(1); // arrow → RIGHT into target left
		});

		it('SS source-left-of-target uses direct segment (rightward arrow)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(2);
			expect(p[0]?.x).toBe(0);
			expect(p[1]?.x).toBe(180);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('SS zero-gap uses loop (5 pts after stub collapse)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 0, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			// exitDir=-24 and approachX=-24 share the same x → one duplicate removed
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('SS source-right-of-target uses loop (rightward entry)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 200, 20, 100)],
				[2, bar(2, 0, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('FF source-right-of-target uses direct segment (leftward arrow)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)], // right edge at 100
				[2, bar(2, 0, 20, 80)], // right edge at 80 → sx > tx
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(2);
			expect(lastSegmentDir(p)).toBe(-1); // arrow ← LEFT
		});

		it('FF zero-gap uses loop (5 pts after stub collapse)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 0, 20, 100)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			// exitDir=24 and approachX=124 share the same x → one duplicate removed
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(-1);
		});

		it('FF source-left-of-target uses loop (leftward entry)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(-1);
		});

		it('SF source-right-of-target uses direct segment (leftward arrow)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 180, 20, 100)], // left edge at 180
				[2, bar(2, 0, 20, 80)], // right edge at 80 → sx > tx
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(2);
			expect(lastSegmentDir(p)).toBe(-1);
		});

		it('SF zero-gap uses loop', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 0, 20, 100)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(-1);
		});

		it('SF source-left-of-target uses loop (leftward entry)', () => {
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SF'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 20, 80)],
			]);
			const routed = routeLinks(links, layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(-1);
		});
	});

	describe('multi-row routing', () => {
		it('FS forward uses 5-point path with rightward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 80, 80)],
			]);
			const routed = routeLinks([{id: 2, source: 1, target: 2, type: 'FS'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('FS backward uses 6-point path with rightward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]);
			const routed = routeLinks([{id: 3, source: 1, target: 2, type: 'FS'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('FS degenerate column (sx === tx) uses 6-point path with rightward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 100, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FS'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('SS forward uses 6-point path with rightward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SS'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('SS backward uses 5-point path with rightward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SS'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('FF source-left-of-target uses 5-point path with leftward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FF'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(-1); // arrow ← LEFT into right edge
			expect(p[0]?.x).toBe(100);
			expect(p.at(-1)?.x).toBe(260);
		});

		it('FF source-right-of-target uses 6-point path with leftward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FF'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(-1);
		});

		it('SF source-left-of-target uses 6-point path with leftward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SF'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(6);
			expect(lastSegmentDir(p)).toBe(-1);
			expect(p[0]?.x).toBe(0);
			expect(p.at(-1)?.x).toBe(260);
		});

		it('SF source-right-of-target uses 5-point path with leftward arrow', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SF'}], layouts);
			const p = pts(routed);
			expect(p).toHaveLength(5);
			expect(lastSegmentDir(p)).toBe(-1);
		});
	});

	describe('anchor point and direction guarantees', () => {
		it('FS — exit right, enter left → arrow RIGHT', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FS'}], layouts);
			const p = pts(routed);
			expect(firstSegmentDir(p)).toBe(1); // exit RIGHT
			expect(lastSegmentDir(p)).toBe(1); // enter LEFT → arrow RIGHT
		});

		it('SS — exit left, enter left → arrow RIGHT', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SS'}], layouts);
			const p = pts(routed);
			expect(firstSegmentDir(p)).toBe(-1); // exit LEFT
			expect(lastSegmentDir(p)).toBe(1); // enter LEFT → arrow RIGHT
		});

		it('FF — exit right, enter right → arrow LEFT', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FF'}], layouts);
			const p = pts(routed);
			expect(firstSegmentDir(p)).toBe(1); // exit RIGHT
			expect(lastSegmentDir(p)).toBe(-1); // enter RIGHT → arrow LEFT
		});

		it('SF — exit left, enter right → arrow LEFT', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 200, 80, 80)],
			]);
			const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SF'}], layouts);
			const p = pts(routed);
			expect(firstSegmentDir(p)).toBe(-1); // exit LEFT
			expect(lastSegmentDir(p)).toBe(-1); // enter RIGHT → arrow LEFT
		});
	});

	describe('milestone offsets', () => {
		it('uses milestone offsets for source and target across all types', () => {
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 100, 20, 0, 'milestone')],
				[2, bar(2, 200, 80, 0, 'milestone')],
			]);

			const fs = pts(routeLinks([{id: 1, source: 1, target: 2, type: 'FS'}], layouts));
			expect(fs[0]?.x).toBe(110);
			expect(fs.at(-1)?.x).toBe(190);

			const ss = pts(routeLinks([{id: 2, source: 1, target: 2, type: 'SS'}], layouts));
			expect(ss[0]?.x).toBe(90);
			expect(ss.at(-1)?.x).toBe(190);

			const ff = pts(routeLinks([{id: 3, source: 1, target: 2, type: 'FF'}], layouts));
			expect(ff[0]?.x).toBe(110);
			expect(ff.at(-1)?.x).toBe(210);

			const sf = pts(routeLinks([{id: 4, source: 1, target: 2, type: 'SF'}], layouts));
			expect(sf[0]?.x).toBe(90);
			expect(sf.at(-1)?.x).toBe(210);
		});
	});

	describe('stub collapse', () => {
		it('collapses consecutive near-zero-length segments', () => {
			// SS zero-gap on same row: exitDir=-24 and approachX=-24 share the
			// same x → the horizontal cross segment at detourY is zero-length
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'SS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 0, 20, 80)],
			]);
			const p = pts(routeLinks(links, layouts));
			expect(p).toHaveLength(5); // 6 - 1 duplicate removed
			expect(lastSegmentDir(p)).toBe(1);
		});

		it('does not collapse valid non-zero segments', () => {
			// FS backward — crossX ≠ approachX, so the midY horizontal segment
			// is non‑zero and all vertices survive
			const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
			const layouts = new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]);
			const p = pts(routeLinks(links, layouts));
			expect(p).toHaveLength(6);
		});
	});
});
