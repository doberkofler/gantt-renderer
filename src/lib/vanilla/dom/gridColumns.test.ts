import {describe, expect, it} from 'vitest';
import {
	type GridColumn,
	DEFAULT_GRID_COLUMNS,
	gridColumnDefaults,
	gridTemplateColumns,
	visibleColumns,
	gridNaturalWidth,
	GRID_COLUMN_FR_MIN_WIDTH,
} from './gridColumns.ts';
import {type ChartLocale, EN_US_LABELS} from '../../locale.ts';

describe('gridColumns helpers', () => {
	it('computes gridTemplateColumns from column widths', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '1fr'},
			{id: 'b', header: 'B', width: '90px'},
			{id: 'c', header: 'C', width: '90px'},
		];
		expect(gridTemplateColumns(cols)).toBe('1fr 90px 90px');
	});

	it('filters hidden columns from gridTemplateColumns', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '1fr'},
			{id: 'b', header: 'B', width: '90px', visible: false},
			{id: 'c', header: 'C', width: '90px'},
		];
		expect(gridTemplateColumns(cols)).toBe('1fr 90px');
		expect(visibleColumns(cols)).toHaveLength(2);
		expect(visibleColumns(cols)[0]?.id).toBe('a');
		expect(visibleColumns(cols)[1]?.id).toBe('c');
	});

	it('default schema has four columns', () => {
		expect(DEFAULT_GRID_COLUMNS).toHaveLength(4);
		expect(DEFAULT_GRID_COLUMNS[0]?.id).toBe('name');
		expect(DEFAULT_GRID_COLUMNS[1]?.id).toBe('startDate');
		expect(DEFAULT_GRID_COLUMNS[2]?.id).toBe('endDate');
		expect(DEFAULT_GRID_COLUMNS[3]?.id).toBe('actions');
	});
});

describe('gridColumnDefaults', () => {
	it('generates four columns with correct ids', () => {
		const locale: ChartLocale = {code: 'en-US'};
		const columns = gridColumnDefaults(locale);
		expect(columns).toHaveLength(4);
		expect(columns[0]?.id).toBe('name');
		expect(columns[1]?.id).toBe('startDate');
		expect(columns[2]?.id).toBe('endDate');
		expect(columns[3]?.id).toBe('actions');
	});

	it('uses EN_US_LABELS as fallback when locale has no labels', () => {
		const locale: ChartLocale = {code: 'en-US'};
		const columns = gridColumnDefaults(locale);
		expect(columns[0]?.header).toBe(EN_US_LABELS.columnTaskName);
		expect(columns[1]?.header).toBe(EN_US_LABELS.columnStartDate);
		expect(columns[2]?.header).toBe(EN_US_LABELS.columnEndDate);
	});

	it('uses locale label overrides when provided', () => {
		const locale: ChartLocale = {
			code: 'de-DE',
			labels: {
				columnTaskName: 'Aufgabe',
				columnStartDate: 'Start',
				columnEndDate: 'Ende',
			},
		};
		const columns = gridColumnDefaults(locale);
		expect(columns[0]?.header).toBe('Aufgabe');
		expect(columns[1]?.header).toBe('Start');
		expect(columns[2]?.header).toBe('Ende');
	});

	it('falls back to EN_US_LABELS for missing label keys', () => {
		const locale: ChartLocale = {
			code: 'de-DE',
			labels: {columnTaskName: 'Aufgabe'},
		};
		const columns = gridColumnDefaults(locale);
		expect(columns[0]?.header).toBe('Aufgabe');
		expect(columns[1]?.header).toBe(EN_US_LABELS.columnStartDate);
		expect(columns[2]?.header).toBe(EN_US_LABELS.columnEndDate);
	});

	it('actions column has empty header and 28px width', () => {
		const locale: ChartLocale = {code: 'en-US'};
		const columns = gridColumnDefaults(locale);
		expect(columns[3]?.header).toBe('');
		expect(columns[3]?.width).toBe('28px');
	});
});

describe('gridNaturalWidth', () => {
	it('default schema returns 328px (120 + 90 + 90 + 28)', () => {
		expect(gridNaturalWidth(DEFAULT_GRID_COLUMNS)).toBe(328);
	});

	it('sums fixed px columns', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '90px'},
			{id: 'b', header: 'B', width: '90px'},
			{id: 'c', header: 'C', width: '28px'},
		];
		expect(gridNaturalWidth(cols)).toBe(208);
	});

	it('converts fr units using GRID_COLUMN_FR_MIN_WIDTH', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'startDate', header: 'Start', width: '90px'},
		];
		expect(gridNaturalWidth(cols)).toBe(GRID_COLUMN_FR_MIN_WIDTH + 90);
	});

	it('supports fractional fr values', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '2fr'},
			{id: 'b', header: 'B', width: '0.5fr'},
		];
		expect(gridNaturalWidth(cols)).toBe(2.5 * GRID_COLUMN_FR_MIN_WIDTH);
	});

	it('skips hidden columns', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '90px'},
			{id: 'b', header: 'B', width: '90px', visible: false},
			{id: 'c', header: 'C', width: '28px'},
		];
		expect(gridNaturalWidth(cols)).toBe(118);
	});

	it('treats unknown units as 0', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '50%'},
			{id: 'b', header: 'B', width: 'auto'},
			{id: 'c', header: 'C', width: '2em'},
		];
		expect(gridNaturalWidth(cols)).toBe(0);
	});

	it('handles mixed units in schema', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Name', width: '2fr'},
			{id: 'percentComplete', header: 'Progress', width: '70px', field: 'percentComplete'},
			{id: 'startDate', header: 'Start', width: '90px', field: 'startDate'},
			{id: 'endDate', header: 'Days', width: '60px', field: 'endDate'},
		];
		expect(gridNaturalWidth(cols)).toBe(2 * GRID_COLUMN_FR_MIN_WIDTH + 220);
	});

	it('handles whitespace in width values', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: ' 90px '},
			{id: 'b', header: 'B', width: ' 1fr'},
		];
		expect(gridNaturalWidth(cols)).toBe(GRID_COLUMN_FR_MIN_WIDTH + 90);
	});
});
