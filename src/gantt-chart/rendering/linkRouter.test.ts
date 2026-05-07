import {describe, expect, it} from 'vitest';
import {routeLinks} from './linkRouter.ts';
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

describe('linkRouter utilities', () => {
	it('skips links missing source or target layout', () => {
		const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
		const layouts = new Map<number, BarLayout>([[1, bar(1, 0, 20, 100)]]);
		expect(routeLinks(links, layouts)).toEqual([]);
	});

	it('routes same-row links as a direct segment', () => {
		const links: Link[] = [{id: 1, source: 1, target: 2, type: 'FS'}];
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 0, 20, 100)],
			[2, bar(2, 180, 20, 80)],
		]);
		const routed = routeLinks(links, layouts);
		expect(routed[0]?.points).toHaveLength(2);
		expect(routed[0]?.points[0]).toEqual({x: 100, y: 20});
		expect(routed[0]?.points[1]).toEqual({x: 180, y: 20});
	});

	it('routes forward and backward links with bends', () => {
		const forward = routeLinks(
			[{id: 2, source: 1, target: 2, type: 'FS'}],
			new Map<number, BarLayout>([
				[1, bar(1, 0, 20, 100)],
				[2, bar(2, 180, 80, 80)],
			]),
		);
		expect(forward[0]?.points).toHaveLength(4);

		const backward = routeLinks(
			[{id: 3, source: 1, target: 2, type: 'FS'}],
			new Map<number, BarLayout>([
				[1, bar(1, 300, 20, 100)],
				[2, bar(2, 120, 80, 80)],
			]),
		);
		expect(backward[0]?.points).toHaveLength(6);
	});

	it('uses milestone offsets based on link type', () => {
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 100, 20, 0, 'milestone')],
			[2, bar(2, 200, 60, 0, 'milestone')],
		]);

		const fs = routeLinks([{id: 1, source: 1, target: 2, type: 'FS'}], layouts);
		expect(fs[0]?.points[0]?.x).toBe(110);
		expect(fs[0]?.points.at(-1)?.x).toBe(190);

		const ss = routeLinks([{id: 2, source: 1, target: 2, type: 'SS'}], layouts);
		expect(ss[0]?.points[0]?.x).toBe(90);
		expect(ss[0]?.points.at(-1)?.x).toBe(190);
	});

	it('routes FF (finish-to-finish) links', () => {
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 0, 20, 100)],
			[2, bar(2, 180, 60, 80)],
		]);
		const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FF'}], layouts);
		expect(routed[0]?.points[0]?.x).toBe(100);
		expect(routed[0]?.points.at(-1)?.x).toBe(260);
		expect(routed[0]?.points).toHaveLength(4);
	});

	it('routes SF (start-to-finish) links', () => {
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 0, 20, 100)],
			[2, bar(2, 180, 60, 80)],
		]);
		const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SF'}], layouts);
		expect(routed[0]?.points[0]?.x).toBe(0);
		expect(routed[0]?.points.at(-1)?.x).toBe(260);
		expect(routed[0]?.points).toHaveLength(4);
	});

	it('routes FF links with milestones', () => {
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 100, 20, 0, 'milestone')],
			[2, bar(2, 200, 60, 0, 'milestone')],
		]);
		const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'FF'}], layouts);
		expect(routed[0]?.points[0]?.x).toBe(110);
		expect(routed[0]?.points.at(-1)?.x).toBe(210);
	});

	it('routes SF links with milestones', () => {
		const layouts = new Map<number, BarLayout>([
			[1, bar(1, 100, 20, 0, 'milestone')],
			[2, bar(2, 200, 60, 0, 'milestone')],
		]);
		const routed = routeLinks([{id: 1, source: 1, target: 2, type: 'SF'}], layouts);
		expect(routed[0]?.points[0]?.x).toBe(90);
		expect(routed[0]?.points.at(-1)?.x).toBe(210);
	});
});
