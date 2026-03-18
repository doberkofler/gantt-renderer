import {describe, expect, it, vi} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('selection', () => {
	const {mountTracked} = createMountHelpers();

	describe('M2 — stop second-click deselect toggle', () => {
		it('does not fire onSelect on repeated click of same grid row', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const rowLabel = [...container.querySelectorAll('span')].find((el) => el.textContent === 'API Implementation');
			expect(rowLabel).toBeDefined();
			const row = rowLabel?.closest('[role="row"]');
			expect(row).not.toBeNull();

			row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).toHaveBeenCalledWith(3);
			onSelectMock.mockClear();

			row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).not.toHaveBeenCalled();
		});

		it('does not fire onSelect on repeated click of same bar', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const bar = container.querySelector('.gantt-bar');
			expect(bar).not.toBeNull();

			bar?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).toHaveBeenCalledWith(1);
			onSelectMock.mockClear();

			bar?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).not.toHaveBeenCalled();
		});

		it('does not fire onSelect on repeated click of same milestone', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const milestone = container.querySelector('.gantt-milestone');
			expect(milestone).not.toBeNull();

			milestone?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).toHaveBeenCalledWith(5);
			onSelectMock.mockClear();

			milestone?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).not.toHaveBeenCalled();
		});

		it('deselects on background click in the timeline pane', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const row = container.querySelector<HTMLElement>('[role="row"][data-task-id="3"]');
			expect(row).not.toBeNull();
			row?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
			expect(onSelectMock).toHaveBeenCalledWith(3);
			onSelectMock.mockClear();

			const rightPane = container.querySelector<HTMLElement>('[data-pane="right"]');
			expect(rightPane).not.toBeNull();
			const absoluteLayer = rightPane?.querySelector<HTMLElement>(':scope > div:nth-child(2) > div:nth-child(2)');
			expect(absoluteLayer).not.toBeNull();
			absoluteLayer?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

			expect(onSelectMock).toHaveBeenCalledWith(null);
		});

		it('deselects on Escape key when a task is selected', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const bar = container.querySelector('.gantt-bar');
			expect(bar).not.toBeNull();
			bar?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

			expect(onSelectMock).toHaveBeenCalledWith(1);
			onSelectMock.mockClear();

			const root = container.querySelector('.gantt-root');
			root?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
			expect(onSelectMock).toHaveBeenCalledWith(null);
		});

		it('does not fire onSelect when Escape is pressed with no selection', () => {
			const container = document.createElement('div');
			document.body.append(container);
			const onSelectMock = vi.fn<(taskId: number | null) => void>();
			const onSelect = (taskId: number | null): void => {
				onSelectMock(taskId);
			};

			mountTracked(container, INPUT, {onSelect});

			const root = container.querySelector('.gantt-root');
			root?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
			expect(onSelectMock).not.toHaveBeenCalled();
		});
	});

	it('fires onSelect from row clicks and milestone clicks', () => {
		const container = document.createElement('div');
		document.body.append(container);
		const onSelectMock = vi.fn<(taskId: number | null) => void>();
		const onSelect = (taskId: number | null): void => {
			onSelectMock(taskId);
		};

		mountTracked(container, INPUT, {onSelect});

		const rowLabel = [...container.querySelectorAll('span')].find((el) => el.textContent === 'API Implementation');
		expect(rowLabel).toBeDefined();
		rowLabel?.closest('div')?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		const milestone = container.querySelector('.gantt-milestone');
		expect(milestone).not.toBeNull();
		milestone?.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(onSelectMock).toHaveBeenCalledWith(3);
		expect(onSelectMock).toHaveBeenCalledWith(5);
	});

	it('applies subtle selected style class without inline outlines for bars and milestones', async () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = mountTracked(container, INPUT);

		instance.select(3);
		await vi.waitFor(() => {
			const selectedBar = container.querySelector<HTMLElement>('.gantt-bar[data-task-id="3"]');
			expect(selectedBar).not.toBeNull();
			expect(selectedBar?.classList.contains('gantt-shape--selected')).toBe(true);
			expect(selectedBar?.style.outline).toBe('');
			expect(selectedBar?.style.outlineOffset).toBe('');
		});

		instance.select(5);
		await vi.waitFor(() => {
			const selectedShape = container.querySelector<HTMLElement>('.gantt-shape--selected');
			expect(selectedShape?.dataset['taskId']).toBe('5');
			const selectedMilestone = container.querySelector<HTMLElement>('.gantt-milestone[data-task-id="5"]');
			expect(selectedMilestone).not.toBeNull();
			expect(selectedMilestone?.classList.contains('gantt-shape--selected')).toBe(true);
			expect(selectedMilestone?.style.outline).toBe('');
			expect(selectedMilestone?.style.outlineOffset).toBe('');
		});
	});

	it('does not highlight dependency links on selection by default', async () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = mountTracked(container, INPUT);
		instance.select(3);

		await vi.waitFor(() => {
			const linkPaths = container.querySelectorAll<SVGPathElement>('svg path[marker-end]');
			expect(linkPaths.length).toBeGreaterThan(0);
			for (const path of linkPaths) {
				expect(path.getAttribute('stroke')).toBe('var(--gantt-link)');
				expect(path.getAttribute('stroke-width')).toBe('1.5');
				expect(path.getAttribute('marker-end')).toBe('url(#gantt-arrow)');
			}
		});
	});

	it('can explicitly highlight related dependency links on selection', async () => {
		const container = document.createElement('div');
		document.body.append(container);

		const instance = mountTracked(container, INPUT, {highlightLinkedDependenciesOnSelect: true});
		instance.select(3);

		await vi.waitFor(() => {
			const linkPaths = [...container.querySelectorAll<SVGPathElement>('svg path[marker-end]')];
			expect(linkPaths).toHaveLength(3);
			expect(linkPaths[0]?.getAttribute('marker-end')).toBe('url(#gantt-arrow-hi)');
			expect(linkPaths[1]?.getAttribute('marker-end')).toBe('url(#gantt-arrow-hi)');
			expect(linkPaths[2]?.getAttribute('marker-end')).toBe('url(#gantt-arrow)');
		});
	});
});
