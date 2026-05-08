import {showGhostLine, hideGhostLine} from '../dom/dependencyLayer.ts';

type LinkCreationCallbacks = {
	onLinkCreate?: (payload: {sourceTaskId: number; targetTaskId: number; type: 'FS'}) => void;
};

/**
 * Attaches a link-creation drag listener to an endpoint handle.
 *
 * @param handle - The endpoint DOM element.
 * @param sourceTaskId - The task ID from which the link originates.
 * @param anchorX - The X anchor coordinate (task center).
 * @param anchorY - The Y anchor coordinate (task center).
 * @param svgLayer - The SVG dependency layer element for ghost line rendering.
 * @param absoluteLayer - The absolute-positioned layer for coordinate calculations.
 * @param cbs - The chart callbacks.
 * @returns A cleanup function that removes all listeners.
 */
export function attachLinkEndpointHandle(
	handle: HTMLElement,
	sourceTaskId: number,
	anchorX: number,
	anchorY: number,
	svgLayer: SVGSVGElement,
	absoluteLayer: HTMLElement,
	cbs: LinkCreationCallbacks,
): () => void {
	function onPointerDown(e: PointerEvent): void {
		if (e.button !== 0) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		try {
			handle.setPointerCapture(e.pointerId);
		} catch {
			// Browsers/tests may reject synthetic pointer ids.
		}

		let validTargetId: number | null = null;

		function onMove(me: PointerEvent): void {
			const layerRect = absoluteLayer.getBoundingClientRect();
			const x = me.clientX - layerRect.left;
			const y = me.clientY - layerRect.top;

			// Hit-test for bars and milestones
			const el = document.elementFromPoint(me.clientX, me.clientY);
			const barEl = el?.closest<HTMLElement>('[data-task-id]');
			const targetId = barEl !== null && barEl !== undefined ? Number(barEl.dataset['taskId']) : null;

			validTargetId = targetId !== null && targetId !== sourceTaskId ? targetId : null;

			showGhostLine(svgLayer, anchorX, anchorY, x, y, validTargetId !== null);
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			hideGhostLine(svgLayer);

			if (validTargetId !== null) {
				cbs.onLinkCreate?.({sourceTaskId, targetTaskId: validTargetId, type: 'FS'});
			}
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	handle.addEventListener('pointerdown', onPointerDown);
	handle.tabIndex = 0;
	handle.setAttribute('role', 'button');
	handle.setAttribute('aria-label', `Create link from task ${sourceTaskId}`);

	function onKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
		}
	}
	handle.addEventListener('keydown', onKeyDown);

	return () => {
		handle.removeEventListener('pointerdown', onPointerDown);
		handle.removeEventListener('keydown', onKeyDown);
	};
}

/**
 * Creates an endpoint handle DOM element.
 * The caller must position it with inline styles and append it to the layer.
 *
 * @returns A new `HTMLElement` with the `gantt-link-endpoint` class.
 */
export function createEndpointHandle(): HTMLElement {
	const handle = document.createElement('div');
	handle.className = 'gantt-link-endpoint';
	handle.style.position = 'absolute';
	handle.style.width = '10px';
	handle.style.height = '10px';
	handle.style.borderRadius = '50%';
	handle.style.background = 'var(--gantt-link)';
	handle.style.border = '2px solid var(--gantt-bg)';
	handle.style.cursor = 'crosshair';
	handle.style.zIndex = '4';
	handle.style.opacity = '0';
	handle.style.transition = 'opacity 0.15s ease, transform 0.1s ease';
	handle.style.transform = 'translate(-50%, -50%) scale(0.8)';
	handle.style.pointerEvents = 'auto';
	handle.style.touchAction = 'none';
	return handle;
}
