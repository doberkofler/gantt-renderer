import {describe, expect, it, vi} from 'vitest';
import {createDependencyLayer, showGhostLine, hideGhostLine, updateDependencyLayer} from './dependencyLayer.ts';
import {type RoutedLink} from '../../rendering/linkRouter.ts';

function makeRoutedLink(overrides: Partial<RoutedLink> = {}): RoutedLink {
	return {
		linkId: 1,
		sourceTaskId: 1,
		targetTaskId: 2,
		type: 'FS',
		points: [
			{x: 0, y: 0},
			{x: 50, y: 0},
			{x: 50, y: 40},
			{x: 100, y: 40},
		],
		...overrides,
	};
}

describe('createDependencyLayer', () => {
	it('creates an SVG element with arrow markers and ghost line', () => {
		const svg = createDependencyLayer(800, 600);
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(svg.querySelector('#gantt-arrow')).not.toBeNull();
		expect(svg.querySelector('#gantt-arrow-hi')).not.toBeNull();
		expect(svg.querySelector('path.gantt-ghost-line')).not.toBeNull();
	});
});

describe('showGhostLine', () => {
	it('shows ghost line with solid style when valid', () => {
		const svg = createDependencyLayer(800, 600);
		showGhostLine(svg, 0, 20, 100, 20, true);

		const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost?.style.display).toBe('');
		expect(ghost?.getAttribute('d')).toBe('M 0,20 L 100,20');
		expect(ghost?.hasAttribute('stroke-dasharray')).toBe(false);
		expect(ghost?.getAttribute('marker-end')).toBe('url(#gantt-arrow)');
	});

	it('shows ghost line with dashed style when not valid', () => {
		const svg = createDependencyLayer(800, 600);
		showGhostLine(svg, 0, 20, 100, 20, false);

		const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost?.style.display).toBe('');
		expect(ghost?.getAttribute('stroke-dasharray')).toBe('5 3');
		expect(ghost?.hasAttribute('marker-end')).toBe(false);
	});

	it('does nothing when ghost line is missing', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		expect(() => {
			showGhostLine(svg, 0, 0, 10, 10, true);
		}).not.toThrow();
	});
});

describe('hideGhostLine', () => {
	it('hides the ghost line', () => {
		const svg = createDependencyLayer(800, 600);
		showGhostLine(svg, 0, 20, 100, 20, true);
		hideGhostLine(svg);

		const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
		expect(ghost?.style.display).toBe('none');
	});

	it('does nothing when ghost line is missing', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		expect(() => {
			hideGhostLine(svg);
		}).not.toThrow();
	});
});

describe('updateDependencyLayer', () => {
	it('renders link paths', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink()];

		updateDependencyLayer(svg, links, 800, 600, null, false);

		const paths = svg.querySelectorAll<SVGPathElement>('path[data-link-id]');
		expect(paths).toHaveLength(1);
		expect(paths[0]?.dataset['linkId']).toBe('1');
	});

	it('skips links with empty points', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink({points: []})];

		updateDependencyLayer(svg, links, 800, 600, null, false);

		const paths = svg.querySelectorAll<SVGPathElement>('path[data-link-id]');
		expect(paths).toHaveLength(0);
	});

	it('renders highlighted link paths when related to selected task', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink()];

		updateDependencyLayer(svg, links, 800, 600, 1, true);

		const path = svg.querySelector<SVGPathElement>('path[data-link-id]');
		expect(path?.getAttribute('stroke')).toBe('var(--gantt-link-hi)');
		expect(path?.getAttribute('marker-end')).toBe('url(#gantt-arrow-hi)');
	});

	it('fires onLinkClick callback on single click', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink()];
		const onLinkClick = vi.fn<(payload: {id: number; source: number; target: number; type: string}) => void>();

		updateDependencyLayer(svg, links, 800, 600, null, false, {
			onLinkClick: (payload) => {
				onLinkClick(payload);
			},
		});

		const path = svg.querySelector<SVGPathElement>('path[data-link-id]');
		expect(path).not.toBeNull();
		path?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 1}));

		expect(onLinkClick).toHaveBeenCalledWith({
			id: 1,
			source: 1,
			target: 2,
			type: 'FS',
		});
	});

	it('fires onLinkDblClick callback on double click', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink()];
		const onLinkDblClick = vi.fn<(payload: {id: number; source: number; target: number; type: string}) => void>();

		updateDependencyLayer(svg, links, 800, 600, null, false, {
			onLinkDblClick: (payload) => {
				onLinkDblClick(payload);
			},
		});

		const path = svg.querySelector<SVGPathElement>('path[data-link-id]');
		expect(path).not.toBeNull();
		path?.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		expect(onLinkDblClick).toHaveBeenCalledWith({
			id: 1,
			source: 1,
			target: 2,
			type: 'FS',
		});
	});

	it('does not call onLinkClick when callback is undefined', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink()];

		updateDependencyLayer(svg, links, 800, 600, null, false, undefined);

		const path = svg.querySelector<SVGPathElement>('path[data-link-id]');
		expect(() => {
			path?.dispatchEvent(new MouseEvent('click', {bubbles: true, detail: 1}));
		}).not.toThrow();
	});

	it('renders multiple links', () => {
		const svg = createDependencyLayer(800, 600);
		const links: RoutedLink[] = [makeRoutedLink({linkId: 1}), makeRoutedLink({linkId: 2, sourceTaskId: 2, targetTaskId: 3})];

		updateDependencyLayer(svg, links, 800, 600, null, false);

		const paths = svg.querySelectorAll<SVGPathElement>('path[data-link-id]');
		expect(paths).toHaveLength(2);
	});

	it('appends path when ghost line is absent', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		svg.append(defs);

		const links: RoutedLink[] = [makeRoutedLink()];
		updateDependencyLayer(svg, links, 800, 600, null, false);

		const paths = svg.querySelectorAll<SVGPathElement>('path[data-link-id]');
		expect(paths).toHaveLength(1);
		expect(paths[0]?.dataset['linkId']).toBe('1');
	});
});
