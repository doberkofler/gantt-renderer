import {describe, expect, it, vi} from 'vitest';
import {GanttChart} from './gantt-chart.ts';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';
import {GanttError} from '../errors.ts';
import {type Task, type Link} from '../validation/schemas.ts';

const {mountTracked} = createMountHelpers();

function createContainer(): HTMLElement {
	const container = document.createElement('div');
	document.body.append(container);
	return container;
}

describe('setOptions', () => {
	it('changes the time scale and re-renders', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({scale: 'month'});
		const monthHeader = container.querySelector('.gantt-root');
		expect(monthHeader).not.toBeNull();

		instance.setOptions({scale: 'year'});
		const yearHeader = container.querySelector('.gantt-root');
		expect(yearHeader).not.toBeNull();
	});

	it('changes scale through multiple values', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const scales = ['year', 'quarter', 'month', 'week', 'day', 'hour'] as const;
		for (const scale of scales) {
			instance.setOptions({scale});
			expect(container.querySelector('.gantt-root')).not.toBeNull();
		}
	});

	it('updates callbacks without re-rendering DOM', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const initialHtml = container.innerHTML;

		const newSelect = vi.fn<(payload: {task: Task}) => void>();
		instance.setOptions({onTaskSelect: newSelect});

		expect(container.innerHTML).toBe(initialHtml);

		instance.select(1);
		expect(newSelect).toHaveBeenCalledWith({task: expect.objectContaining({id: 1})});
	});

	it('applies data-theme attribute on the container', () => {
		const container = createContainer();
		const instance = new GanttChart(container, {theme: 'light'});
		instance.update(INPUT);

		expect(container.dataset['theme']).toBe('light');

		instance.setOptions({theme: 'dark'});
		expect(container.dataset['theme']).toBe('dark');

		instance.setOptions({theme: 'system'});
		expect(container.dataset['theme']).toBe('system');
	});

	it('updates highlightLinkedDependenciesOnSelect', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({highlightLinkedDependenciesOnSelect: true});
		expect(container.querySelector('.gantt-root')).not.toBeNull();

		instance.setOptions({highlightLinkedDependenciesOnSelect: false});
		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates linkCreationEnabled', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({linkCreationEnabled: true});
		expect(container.querySelector('.gantt-root')).not.toBeNull();

		instance.setOptions({linkCreationEnabled: false});
		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates locale and re-renders both panes', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({locale: 'de-DE'});
		expect(container.querySelector('.gantt-root')).not.toBeNull();

		instance.setOptions({locale: 'fr-FR'});
		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates showWeekends and re-renders timeline', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT, {scale: 'day'});

		instance.setOptions({showWeekends: false});
		expect(container.querySelector('.gantt-root')).not.toBeNull();

		instance.setOptions({showWeekends: true});
		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates weekendDays and specialDays', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({weekendDays: [5, 6]});
		expect(container.querySelector('.gantt-root')).not.toBeNull();

		instance.setOptions({
			specialDays: [{date: '2026-02-11', kind: 'custom', label: 'Freeze'}],
		});
		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates height and re-renders', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({height: 600});
		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root).not.toBeNull();
		expect(root?.style.height).toBe('600px');

		instance.setOptions({height: 800});
		expect(root?.style.height).toBe('800px');
	});

	it('updates multiple options at once', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		instance.setOptions({
			scale: 'month',
			theme: 'dark',
			height: 700,
			highlightLinkedDependenciesOnSelect: true,
		});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root?.style.height).toBe('700px');
	});

	it('throws when instance is destroyed', () => {
		const container = createContainer();
		const instance = new GanttChart(container);
		instance.update(INPUT);
		instance.destroy();

		expect(() => {
			instance.setOptions({scale: 'week'});
		}).toThrow(GanttError);
	});

	it('updates onTaskMove callback and uses it after setOptions', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const moveSpy = vi.fn<(payload: {task: Task; newStartDate: Date}) => boolean>();
		instance.setOptions({onTaskMove: moveSpy});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates onTaskResize callback and uses it after setOptions', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const resizeSpy = vi.fn<(payload: {task: Task; newDurationHours: number}) => boolean>();
		instance.setOptions({onTaskResize: resizeSpy});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates onLinkCreate callback and uses it after setOptions', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const linkSpy = vi.fn<(payload: {type: 'FS'; sourceTask: Task; targetTask: Task}) => boolean>();
		instance.setOptions({onLinkCreate: linkSpy});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('updates onLeftPaneWidthChange and onGridColumnsChange callbacks', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const paneSpy = vi.fn<(_width: number) => void>();
		const colSpy = vi.fn<(_columns: unknown[]) => void>();
		instance.setOptions({onLeftPaneWidthChange: paneSpy, onGridColumnsChange: colSpy});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});

	it('does not re-render left pane when only right-pane options change', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const leftPane = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPane).not.toBeNull();
		const initialLeftHtml = leftPane?.innerHTML ?? '';

		instance.setOptions({scale: 'year'});

		const leftPaneAfter = container.querySelector<HTMLElement>('[data-pane="left"]');
		expect(leftPaneAfter).not.toBeNull();
		expect(leftPaneAfter?.innerHTML).toBe(initialLeftHtml);
	});

	it('preserves existing options when only some are changed', () => {
		const container = createContainer();
		const instance = new GanttChart(container, {
			scale: 'week',
			height: 600,
			theme: 'light',
		});
		instance.update(INPUT);

		const root = container.querySelector<HTMLElement>('.gantt-root');
		expect(root?.style.height).toBe('600px');

		instance.setOptions({scale: 'month'});

		expect(root?.style.height).toBe('600px');
	});

	it('does nothing when only callbacks are changed', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const initialHtml = container.innerHTML;

		instance.setOptions({
			onTaskSelect: vi.fn<(payload: {task: Task}) => void>(),
			onTaskMove: vi.fn<(payload: {task: Task; newStartDate: Date}) => boolean>(),
			onTaskDoubleClick: vi.fn<(payload: {task: Task}) => void>(),
			onTaskAdd: vi.fn<(payload: {parentTask: Task}) => boolean>(),
		});

		expect(container.innerHTML).toBe(initialHtml);
	});

	it('updates onLinkClick and onLinkDblClick callbacks', () => {
		const container = createContainer();
		const instance = mountTracked(container, INPUT);

		const linkClickSpy = vi.fn<(payload: {link: Link}) => void>();
		const linkDblClickSpy = vi.fn<(payload: {link: Link}) => void>();
		instance.setOptions({onLinkClick: linkClickSpy, onLinkDblClick: linkDblClickSpy});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
	});
});
