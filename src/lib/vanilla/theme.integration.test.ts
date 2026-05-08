import {describe, expect, it} from 'vitest';
import {INPUT, createMountHelpers} from './gantt-chart.test-utils.ts';

describe('m15 — dark mode theme support', () => {
	const {mountTracked} = createMountHelpers();

	it('sets data-theme="dark" on container when theme is "dark"', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'dark'});

		expect(container.dataset['theme']).toBe('dark');
	});

	it('sets data-theme="light" on container when theme is "light"', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'light'});

		expect(container.dataset['theme']).toBe('light');
	});

	it('sets data-theme="system" on container when theme is "system"', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'system'});

		expect(container.dataset['theme']).toBe('system');
	});

	it('defaults data-theme to "system" when theme is omitted', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {});

		expect(container.dataset['theme']).toBe('system');
	});

	it('renders chart correctly with dark theme without visual regression', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'dark'});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
		expect(container.querySelectorAll('.gantt-bar').length).toBeGreaterThan(0);
		expect(container.querySelectorAll('.gantt-milestone')).toHaveLength(1);
	});

	it('renders chart correctly with light theme without visual regression', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'light'});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
		expect(container.querySelectorAll('.gantt-bar').length).toBeGreaterThan(0);
		expect(container.querySelectorAll('.gantt-milestone')).toHaveLength(1);
	});

	it('renders chart correctly with system theme without visual regression', () => {
		const container = document.createElement('div');
		document.body.append(container);

		mountTracked(container, INPUT, {theme: 'system'});

		expect(container.querySelector('.gantt-root')).not.toBeNull();
		expect(container.querySelectorAll('.gantt-bar').length).toBeGreaterThan(0);
		expect(container.querySelectorAll('.gantt-milestone')).toHaveLength(1);
	});
});
