import {act, createElement, createRef, StrictMode, type Ref} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {GanttChart, type GanttChartReactProps} from './react.tsx';
import {type GanttInputRaw} from './validation/schemas.ts';
import {type GanttCallbacks, type GanttInstance} from './vanilla/gantt-chart.ts';

declare global {
	var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const INPUT: GanttInputRaw = {
	tasks: [
		{id: 1, text: 'Planning', startDate: '2026-02-01', endDate: '2026-02-03', kind: 'project'},
		{id: 2, text: 'Build', startDate: '2026-02-01', endDate: '2026-02-02', kind: 'task', parent: 1},
	],
	links: [],
};

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderComponent(props: GanttChartReactProps & {readonly ref?: Ref<GanttInstance>}, strict = false): void {
	if (container === null) {
		container = document.createElement('div');
		document.body.append(container);
		root = createRoot(container);
	}
	const component = createElement(GanttChart, props);
	act(() => {
		root?.render(strict ? <StrictMode>{component}</StrictMode> : component);
	});
}

describe('GanttChart React adapter', () => {
	afterEach(() => {
		act(() => {
			root?.unmount();
		});
		container?.remove();
		container = null;
		root = null;
	});

	it('renders input in an adapter-owned host', () => {
		renderComponent({input: INPUT, className: 'project-chart'});

		expect(container?.querySelector('.gantt-react.project-chart > .gantt-root')).not.toBeNull();
		expect(container?.textContent).toContain('Planning');
	});

	it('updates when the input identity changes', () => {
		renderComponent({input: INPUT});
		const updatedInput: GanttInputRaw = {
			...INPUT,
			tasks: INPUT.tasks.map((task) => (task.id === 2 ? {...task, text: 'Implementation'} : task)),
		};
		renderComponent({input: updatedInput});

		expect(container?.textContent).toContain('Implementation');
		expect(container?.textContent).not.toContain('Build');
	});

	it('updates options without recreating the native instance', () => {
		const ref = createRef<GanttInstance>();
		renderComponent({input: INPUT, options: {height: 300}, ref});
		const instance = ref.current;

		renderComponent({input: INPUT, options: {height: 420}, ref});

		expect(ref.current).toBe(instance);
		expect(container?.querySelector<HTMLElement>('.gantt-root')?.style.height).toBe('420px');
	});

	it('recreates the native instance when an option is removed', () => {
		const ref = createRef<GanttInstance>();
		renderComponent({input: INPUT, options: {height: 300}, ref});
		const instance = ref.current;

		renderComponent({input: INPUT, options: {}, ref});

		expect(ref.current).not.toBe(instance);
		expect(container?.querySelector<HTMLElement>('.gantt-root')?.style.height).toBe('500px');
	});

	it('uses the latest callbacks without recreating the native instance', () => {
		const first = vi.fn<NonNullable<GanttCallbacks['onTaskClick']>>();
		const second = vi.fn<NonNullable<GanttCallbacks['onTaskClick']>>();
		const ref = createRef<GanttInstance>();
		renderComponent({input: INPUT, callbacks: {onTaskClick: first}, ref});
		const instance = ref.current;

		renderComponent({input: INPUT, callbacks: {onTaskClick: second}, ref});
		act(() => {
			ref.current?.select(2, true);
		});

		expect(ref.current).toBe(instance);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith(expect.objectContaining({task: expect.objectContaining({id: 2}), instance}));
	});

	it('updates and clears the forwarded ref', () => {
		const firstRef = createRef<GanttInstance>();
		const secondRef = createRef<GanttInstance>();
		renderComponent({input: INPUT, ref: firstRef});
		const instance = firstRef.current;

		renderComponent({input: INPUT, ref: secondRef});
		expect(firstRef.current).toBeNull();
		expect(secondRef.current).toBe(instance);

		act(() => {
			root?.unmount();
		});
		expect(secondRef.current).toBeNull();
		expect(container?.querySelector('.gantt-root')).toBeNull();
	});

	it('supports React Strict Mode lifecycle replay', () => {
		const ref = createRef<GanttInstance>();
		renderComponent({input: INPUT, ref}, true);

		expect(ref.current).not.toBeNull();
		expect(container?.querySelectorAll('.gantt-root')).toHaveLength(1);
	});
});
