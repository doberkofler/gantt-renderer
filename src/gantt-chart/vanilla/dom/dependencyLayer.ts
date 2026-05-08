import {setAttrs} from './helpers.ts';
import {type RoutedLink} from '../../rendering/linkRouter.ts';

const NS = 'http://www.w3.org/2000/svg';
const ARROW_PATH = 'M 0 1 L 10 5 L 0 9 Z';
const ARROW_SIZE = 6;

/**
 * Creates the SVG overlay element. Call once; pass to updateDependencyLayer on each render.
 * Also creates a hidden ghost-line path used during link-creation drags.
 *
 * The SVG is initially zero-sized; `updateDependencyLayer` sets width/height each frame.
 *
 * @param _totalWidth - The total pixel width of the SVG viewport.
 * @param _totalHeight - The total pixel height of the SVG viewport.
 * @returns An `SVGSVGElement` ready to be inserted into the DOM.
 */
export function createDependencyLayer(_totalWidth: number, _totalHeight: number): SVGSVGElement {
	const svg = document.createElementNS(NS, 'svg');
	Object.assign(svg.style, {
		position: 'absolute',
		top: '0',
		left: '0',
		pointerEvents: 'none',
		overflow: 'visible',
		zIndex: '1',
	});

	// Arrow markers (created once, reused by all paths via xlink/href)
	const defs = document.createElementNS(NS, 'defs');

	for (const [id, color] of [
		['gantt-arrow', 'var(--gantt-link)'],
		['gantt-arrow-hi', 'var(--gantt-link-hi)'],
	] as const) {
		const marker = document.createElementNS(NS, 'marker');
		setAttrs(marker, {
			id,
			viewBox: '0 0 10 10',
			refX: '10',
			refY: '5',
			markerWidth: ARROW_SIZE,
			markerHeight: ARROW_SIZE,
			orient: 'auto',
		});
		const path = document.createElementNS(NS, 'path');
		setAttrs(path, {d: ARROW_PATH, fill: color});
		marker.append(path);
		defs.append(marker);
	}

	svg.append(defs);

	// Ghost line for link-creation drag (hidden by default)
	const ghostPath = document.createElementNS(NS, 'path');
	setAttrs(ghostPath, {
		d: '',
		fill: 'none',
		stroke: 'var(--gantt-link)',
		'stroke-width': '1.5',
		'stroke-dasharray': '5 3',
	});
	ghostPath.classList.add('gantt-ghost-line');
	ghostPath.style.display = 'none';
	svg.append(ghostPath);

	return svg;
}

/**
 * Shows or updates the ghost line drawn during a link-creation drag.
 *
 * @param svg - The SVG dependency layer element.
 * @param x1 - Start X coordinate.
 * @param y1 - Start Y coordinate.
 * @param x2 - End X coordinate.
 * @param y2 - End Y coordinate.
 * @param valid - When `true`, the line is drawn solid with an arrow marker.
 */
export function showGhostLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, valid: boolean): void {
	const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
	if (ghost === null) {
		return;
	}
	setAttrs(ghost, {
		d: `M ${x1},${y1} L ${x2},${y2}`,
	});
	if (valid) {
		ghost.removeAttribute('stroke-dasharray');
	} else {
		ghost.setAttribute('stroke-dasharray', '5 3');
	}
	if (valid) {
		ghost.setAttribute('marker-end', 'url(#gantt-arrow)');
	} else {
		ghost.removeAttribute('marker-end');
	}
	ghost.style.display = '';
}

/**
 * Hides the ghost line after a link-creation drag completes or is cancelled.
 *
 * @param svg - The SVG dependency layer element.
 */
export function hideGhostLine(svg: SVGSVGElement): void {
	const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
	if (ghost !== null) {
		ghost.style.display = 'none';
		ghost.removeAttribute('marker-end');
	}
}

/**
 * Replaces all path elements in the SVG to reflect the current link set.
 * The `<defs>` node (first child) is preserved.
 *
 * @param svg - The SVG dependency layer element.
 * @param links - The array of routed links to render.
 * @param totalWidth - The total pixel width of the SVG viewport.
 * @param totalHeight - The total pixel height of the SVG viewport.
 * @param selectedTaskId - The currently selected task ID, or `null`.
 * @param highlightLinkedDependenciesOnSelect - When `true`, links connected to the selected task use highlight styling.
 */
export function updateDependencyLayer(
	svg: SVGSVGElement,
	links: RoutedLink[],
	totalWidth: number,
	totalHeight: number,
	selectedTaskId: number | null,
	highlightLinkedDependenciesOnSelect: boolean,
): void {
	setAttrs(svg, {width: totalWidth, height: totalHeight});

	const toRemove = [...svg.children].slice(1).filter((c) => !c.classList.contains('gantt-ghost-line'));
	for (const node of toRemove) {
		svg.removeChild(node);
	}

	const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');

	for (const link of links) {
		const {points} = link;
		if (points.length === 0) {
			continue;
		}

		const [first, ...rest] = points as [(typeof points)[0], ...(typeof points)[0][]];
		const d = `M ${first.x},${first.y}${rest.map((p) => ` L ${p.x},${p.y}`).join('')}`;

		const isRelated =
			highlightLinkedDependenciesOnSelect && selectedTaskId !== null && (link.sourceTaskId === selectedTaskId || link.targetTaskId === selectedTaskId);

		const path = document.createElementNS(NS, 'path');
		setAttrs(path, {
			d,
			fill: 'none',
			stroke: isRelated ? 'var(--gantt-link-hi)' : 'var(--gantt-link)',
			'stroke-width': isRelated ? '1.8' : '1.5',
			'stroke-linejoin': 'round',
			'marker-end': isRelated ? 'url(#gantt-arrow-hi)' : 'url(#gantt-arrow)',
			'data-link-id': String(link.linkId),
		});
		if (ghost !== null) {
			svg.insertBefore(path, ghost);
		} else {
			svg.append(path);
		}
	}
}
