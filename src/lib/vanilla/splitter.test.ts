import {describe, expect, it, vi} from 'vitest';
import {attachSplitter} from './splitter.ts';

describe('attachSplitter', () => {
	it('calls onDragEnd with final width when splitter is dragged', () => {
		const onDragEnd = vi.fn<(width: number) => void>();

		const container = document.createElement('div');
		const leftPane = document.createElement('div');
		const splitterHandle = document.createElement('div');
		leftPane.style.width = '300px';
		container.append(leftPane, splitterHandle);

		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 1000});

		attachSplitter(splitterHandle, leftPane, container, 220, onDragEnd);

		const downEvent = new PointerEvent('pointerdown', {button: 0, clientX: 350});
		splitterHandle.dispatchEvent(downEvent);

		const moveEvent = new PointerEvent('pointermove', {clientX: 450});
		window.dispatchEvent(moveEvent);

		const upEvent = new PointerEvent('pointerup');
		window.dispatchEvent(upEvent);

		expect(onDragEnd).toHaveBeenCalledExactlyOnceWith(400);
	});

	it('ignores non-primary button clicks', () => {
		const onDragEnd = vi.fn<(width: number) => void>();

		const container = document.createElement('div');
		const leftPane = document.createElement('div');
		const splitterHandle = document.createElement('div');
		container.append(leftPane, splitterHandle);

		attachSplitter(splitterHandle, leftPane, container, 220, onDragEnd);

		const downEvent = new PointerEvent('pointerdown', {button: 1, clientX: 350});
		splitterHandle.dispatchEvent(downEvent);

		expect(onDragEnd).not.toHaveBeenCalled();
	});

	it('handles undefined initial width gracefully', () => {
		const onDragEnd = vi.fn<(width: number) => void>();

		const container = document.createElement('div');
		const leftPane = document.createElement('div');
		const splitterHandle = document.createElement('div');
		container.append(leftPane, splitterHandle);

		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 1000});

		attachSplitter(splitterHandle, leftPane, container, 220, onDragEnd);

		splitterHandle.dispatchEvent(new PointerEvent('pointerdown', {button: 0, clientX: 200}));
		window.dispatchEvent(new PointerEvent('pointermove', {clientX: 300}));
		window.dispatchEvent(new PointerEvent('pointerup'));

		expect(onDragEnd).toHaveBeenCalledExactlyOnceWith(100);
	});

	it('handles zero container width gracefully', () => {
		const onDragEnd = vi.fn<(width: number) => void>();

		const container = document.createElement('div');
		const leftPane = document.createElement('div');
		const splitterHandle = document.createElement('div');
		leftPane.style.width = '200px';
		container.append(leftPane, splitterHandle);

		Object.defineProperty(container, 'clientWidth', {configurable: true, value: 0});

		attachSplitter(splitterHandle, leftPane, container, 220, onDragEnd);

		splitterHandle.dispatchEvent(new PointerEvent('pointerdown', {button: 0, clientX: 200}));
		window.dispatchEvent(new PointerEvent('pointermove', {clientX: 400}));
		window.dispatchEvent(new PointerEvent('pointerup'));

		expect(onDragEnd).toHaveBeenCalledExactlyOnceWith(400);
	});
});
