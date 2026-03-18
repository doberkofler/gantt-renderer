import {describe, expect, it} from 'vitest';
import {appendAll, clearChildren, css, el, setAttrs, svgEl} from './helpers.ts';

describe('dom helper utilities', () => {
	it('creates HTML element and applies properties/attributes/styles', () => {
		const node = el('div', {
			className: 'card',
			title: 'hello',
			style: {width: '120px'},
			'aria-label': 'label',
		}) as HTMLDivElement;

		expect(node.tagName).toBe('DIV');
		expect(node.className).toBe('card');
		expect(node.title).toBe('hello');
		expect(node.style.width).toBe('120px');
		expect(node.getAttribute('aria-label')).toBe('label');
	});

	it('applies css styles, appends children, and clears node', () => {
		const parent = document.createElement('div');
		const a = document.createElement('span');
		a.textContent = 'a';
		const b = document.createTextNode('b');

		css(parent, {display: 'flex', height: '10px'});
		appendAll(parent, [a, b]);
		expect(parent.style.display).toBe('flex');
		expect(parent.childNodes).toHaveLength(2);

		clearChildren(parent);
		expect(parent.childNodes).toHaveLength(0);
	});

	it('creates and updates SVG elements', () => {
		const circle = svgEl('circle', {cx: 10, cy: 20, r: 5});
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.getAttribute('cx')).toBe('10');

		setAttrs(circle, {stroke: 'red', 'stroke-width': 2});
		expect(circle.getAttribute('stroke')).toBe('red');
		expect(circle.getAttribute('stroke-width')).toBe('2');
	});
});
