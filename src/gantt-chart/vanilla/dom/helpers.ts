/**
 * Batches style assignments; avoids repeated style recalculations.
 *
 * @param elem - The target element.
 * @param styles - A partial CSS style declaration to apply.
 */
export function css(elem: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
	for (const [k, v] of Object.entries(styles)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(elem.style as any)[k] = v ?? '';
	}
}

/**
 * Typed element factory. Avoids littering `as HTMLElement` casts everywhere.
 *
 * @example
 *   const div = el('div', {className: 'gantt-bar'});
 *   const svg = el('svg', {}, 'http://www.w3.org/2000/svg');
 */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>, ns?: never): HTMLElementTagNameMap[K];
export function el(tag: string, props?: Record<string, unknown>, ns?: string): Element;
export function el(tag: string, props?: Record<string, unknown>, ns?: string): Element {
	const elem = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
	if (props !== undefined) {
		for (const [k, v] of Object.entries(props)) {
			if (k === 'style' && typeof v === 'object' && v !== null) {
				css(elem as HTMLElement, v as Partial<CSSStyleDeclaration>);
			} else if (k in elem) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(elem as any)[k] = v;
			} else {
				elem.setAttribute(k, String(v));
			}
		}
	}
	return elem;
}

/**
 * Removes all child nodes from elem. Faster than `innerHTML = ''` for large subtrees.
 *
 * @param elem - The element to clear.
 */
export function clearChildren(elem: Element): void {
	while (elem.firstChild !== null) {
		elem.removeChild(elem.firstChild);
	}
}

/**
 * Appends all nodes from an array/fragment into parent in one pass.
 *
 * @param parent - The parent element.
 * @param children - The child elements or text nodes to append.
 */
export function appendAll(parent: Element, children: (Element | Text)[]): void {
	const frag = document.createDocumentFragment();
	for (const c of children) {
		frag.appendChild(c);
	}
	parent.append(frag);
}

/**
 * Creates an SVG element in the SVG namespace.
 *
 * @param tag - The SVG tag name.
 * @param attrs - Optional attributes to set on the element.
 * @returns A new SVG element.
 */
export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Record<string, string | number>): SVGElementTagNameMap[K] {
	const NS = 'http://www.w3.org/2000/svg';
	const elem = document.createElementNS(NS, tag);
	if (attrs !== undefined) {
		for (const [k, v] of Object.entries(attrs)) {
			elem.setAttribute(k, String(v));
		}
	}
	return elem;
}

/**
 * Sets multiple SVG attributes in one call.
 *
 * @param elem - The target SVG element.
 * @param attrs - Attributes to set (values are stringified).
 */
export function setAttrs(elem: Element, attrs: Record<string, string | number>): void {
	for (const [k, v] of Object.entries(attrs)) {
		elem.setAttribute(k, String(v));
	}
}
