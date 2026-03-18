import {describe, expect, it} from 'vitest';
import {computeLeftPaneWidth} from './responsive.ts';

const defaults = {
	hostWidth: 1200,
	defaultWidth: 300,
	userSplitWidth: null,
	explicitOptWidth: undefined,
	responsiveSplitPane: true,
	mobileBreakpoint: 768,
	mobileLeftPaneMinWidth: 140,
	mobileLeftPaneMaxRatio: 0.45,
	timelineMinWidth: 220,
};

describe('computeLeftPaneWidth', () => {
	it('returns default width when host width is zero or negative', () => {
		expect(computeLeftPaneWidth({...defaults, hostWidth: 0})).toBe(300);
		expect(computeLeftPaneWidth({...defaults, hostWidth: -1})).toBe(300);
	});

	it('respects user split width', () => {
		expect(computeLeftPaneWidth({...defaults, userSplitWidth: 400})).toBe(400);
	});

	it('respects explicit option width', () => {
		expect(computeLeftPaneWidth({...defaults, explicitOptWidth: 350})).toBe(350);
	});

	it('user split width takes priority over explicit option width', () => {
		expect(computeLeftPaneWidth({...defaults, userSplitWidth: 400, explicitOptWidth: 350})).toBe(400);
	});

	it('clamps to max allowed width considering timeline min', () => {
		const result = computeLeftPaneWidth({...defaults, defaultWidth: 2000});
		expect(result).toBeLessThanOrEqual(1200 - 220);
		expect(result).toBeGreaterThanOrEqual(96);
	});

	it('clamps to minimum 96px', () => {
		const narrow = computeLeftPaneWidth({
			...defaults,
			hostWidth: 300,
			defaultWidth: 10,
			timelineMinWidth: 200,
		});
		expect(narrow).toBe(96);
	});

	it('uses mobile ratio when below mobile breakpoint', () => {
		const mobile = computeLeftPaneWidth({
			...defaults,
			hostWidth: 500,
			defaultWidth: 300,
			mobileBreakpoint: 768,
			mobileLeftPaneMaxRatio: 0.45,
			mobileLeftPaneMinWidth: 140,
		});
		expect(mobile).toBeLessThanOrEqual(Math.floor(500 * 0.45));
		expect(mobile).toBeGreaterThanOrEqual(140);
	});

	it('uses desktop ratio when above mobile breakpoint', () => {
		const desktop = computeLeftPaneWidth({
			...defaults,
			hostWidth: 1200,
			defaultWidth: 300,
		});
		const minProportional = Math.floor(1200 * 0.25);
		const maxProportional = Math.floor(1200 * 0.4);
		expect(desktop).toBeGreaterThanOrEqual(minProportional);
		expect(desktop).toBeLessThanOrEqual(maxProportional);
	});

	it('skips mobile breakpoint when responsiveSplitPane is false but still applies desktop ratio', () => {
		const result = computeLeftPaneWidth({
			...defaults,
			hostWidth: 500,
			defaultWidth: 300,
			responsiveSplitPane: false,
		});
		const maxProportional = Math.floor(500 * 0.4);
		expect(result).toBeLessThanOrEqual(maxProportional);
	});
});
