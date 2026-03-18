const MIN_PANE_WIDTH = 96;

export function attachSplitter(
	splitterHandle: HTMLElement,
	leftPane: HTMLElement,
	container: HTMLElement,
	timelineMinWidth: number,
	onDragEnd: (width: number) => void,
): void {
	splitterHandle.addEventListener('pointerdown', (e: PointerEvent) => {
		if (e.button !== 0) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		const startX = e.clientX;
		const startWidth = Number.parseFloat(leftPane.style.width) || 0;

		function onMove(me: PointerEvent): void {
			const dx = me.clientX - startX;
			let newWidth = startWidth + dx;
			const hostWidth = container.clientWidth;
			if (hostWidth > 0) {
				newWidth = Math.max(MIN_PANE_WIDTH, Math.min(newWidth, hostWidth - timelineMinWidth));
			}
			newWidth = Math.max(MIN_PANE_WIDTH, newWidth);
			leftPane.style.width = `${newWidth}px`;
			leftPane.style.minWidth = `${newWidth}px`;
			leftPane.style.maxWidth = `${newWidth}px`;
		}

		function onUp(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			const finalWidth = Number.parseFloat(leftPane.style.width);
			onDragEnd(finalWidth);
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	});
}
