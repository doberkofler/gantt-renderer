import {setAttrs} from './helpers.ts';
import {type RoutedLink} from '../../rendering/linkRouter.ts';

const NS = 'http://www.w3.org/2000/svg';
const ARROW_SIZE = 6;

/**
 * Creates the SVG overlay element. Call once; pass to updateDependencyLayer on each render.
 * Also creates a hidden ghost-line path used during link-creation drags.
 */
export function createDependencyLayer(totalWidth: number, totalHeight: number): SVGSVGElement {
	const svg = document.createElementNS(NS, 'svg');
	setAttrs(svg, {
		width: totalWidth,
		height: totalHeight,
	});
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
			refX: '9',
			refY: '5',
			markerWidth: ARROW_SIZE,
			markerHeight: ARROW_SIZE,
			orient: 'auto',
		});
		const path = document.createElementNS(NS, 'path');
		setAttrs(path, {d: 'M 0 1 L 10 5 L 0 9 Z', fill: color});
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
 * Pass valid=true when the pointer is over a valid target bar.
 */
export function showGhostLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, valid: boolean): void {
	const ghost = svg.querySelector<SVGPathElement>('path.gantt-ghost-line');
	if (ghost === null) {
		return;
	}
	setAttrs(ghost, {
		d: `M ${x1},${y1} L ${x2},${y2}`,
		'stroke-dasharray': valid ? 'none' : '5 3',
	});
	if (valid) {
		ghost.setAttribute('marker-end', 'url(#gantt-arrow)');
	} else {
		ghost.removeAttribute('marker-end');
	}
	ghost.style.display = '';
}

/**
 * Hides the ghost line after a link-creation drag completes or is cancelled.
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

	// Remove existing paths (keep defs at index 0, and keep ghost path)
	const toRemove: Element[] = [];
	for (let i = 1; i < svg.children.length; i++) {
		const child = svg.children[i];
		if (child !== undefined && !child.classList.contains('gantt-ghost-line')) {
			toRemove.push(child);
		}
	}
	for (const node of toRemove) {
		svg.removeChild(node);
	}

	for (const link of links) {
		const {points} = link;
		if (points.length === 0) {
			continue;
		}

		let d = `M ${points[0]?.x ?? 0},${points[0]?.y ?? 0}`;
		for (let i = 1; i < points.length; i++) {
			const p = points[i];
			if (p !== undefined) {
				d += ` L ${p.x},${p.y}`;
			}
		}

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
		});
		svg.append(path);
	}
}
