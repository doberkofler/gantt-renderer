import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';
import {type GanttInstance} from './gantt-chart.ts';

describe('tooltip', () => {
	const {mountTracked} = createMountHelpers();

	it('shows tooltip on bar mouseenter and hides on mouseleave', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipTextMock = vi.fn<(payload: {task: {id: number}; instance: GanttInstance}) => string | null>();
		const onTooltipText = (payload: {task: {id: number}; instance: GanttInstance}): string | null => {
			onTooltipTextMock(payload);
			return `Task: ${payload.task.id}`;
		};

		mountTracked(container, INPUT, {}, {onTooltipText});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));
		expect(onTooltipTextMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 1})}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.style.display).toBe('');
		expect(tooltip?.innerHTML).toBe('Task: 1');

		bar?.dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}));
		expect(tooltip?.style.display).toBe('none');
	});

	it('hides tooltip when onTooltipText returns null', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipText = (): null => null;

		mountTracked(container, INPUT, {}, {onTooltipText});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.style.display).toBe('none');
	});

	it('hides tooltip when onTooltipText returns empty string', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipText = (): string => '';

		mountTracked(container, INPUT, {}, {onTooltipText});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.style.display).toBe('none');
	});

	it('shows tooltip on milestone mouseenter', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipTextMock = vi.fn<(payload: {task: {id: number}; instance: GanttInstance}) => string | null>();
		const onTooltipText = (payload: {task: {id: number}; instance: GanttInstance}): string | null => {
			onTooltipTextMock(payload);
			return `Milestone: ${payload.task.id}`;
		};

		mountTracked(container, INPUT, {}, {onTooltipText});

		const milestone = container.querySelector('.gantt-milestone');
		expect(milestone).not.toBeNull();

		milestone?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));
		expect(onTooltipTextMock).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 5})}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.style.display).toBe('');
		expect(tooltip?.innerHTML).toBe('Milestone: 5');

		milestone?.dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}));
		expect(tooltip?.style.display).toBe('none');
	});

	it('positions tooltip on mousemove', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipText = (): string => 'test';

		mountTracked(container, INPUT, {}, {onTooltipText});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));
		bar?.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: 200, clientY: 150}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.style.left).not.toBe('');
		expect(tooltip?.style.top).not.toBe('');
	});

	it('handles HTML content in tooltip', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onTooltipText = (payload: {task: {id: number}}): string => `<strong>Task ${payload.task.id}</strong><br><em>Status: In Progress</em>`;

		mountTracked(container, INPUT, {}, {onTooltipText});

		const bar = container.querySelector('.gantt-bar');
		expect(bar).not.toBeNull();

		bar?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));

		const tooltip = container.querySelector<HTMLElement>('.gantt-tooltip');
		expect(tooltip).not.toBeNull();
		expect(tooltip?.querySelector('strong')).not.toBeNull();
		expect(tooltip?.querySelector('em')).not.toBeNull();
	});
});
