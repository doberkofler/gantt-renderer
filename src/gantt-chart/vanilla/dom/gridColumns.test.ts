import {describe, expect, it} from 'vitest';
import {type GridColumn, DEFAULT_GRID_COLUMNS, gridTemplateColumns, visibleColumns, gridNaturalWidth, GRID_COLUMN_FR_MIN_WIDTH} from './gridColumns.ts';

describe('gridColumns helpers', () => {
	it('computes gridTemplateColumns from column widths', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '1fr'},
			{id: 'b', header: 'B', width: '90px'},
			{id: 'c', header: 'C', width: '68px'},
		];
		expect(gridTemplateColumns(cols)).toBe('1fr 90px 68px');
	});

	it('filters hidden columns from gridTemplateColumns', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '1fr'},
			{id: 'b', header: 'B', width: '90px', visible: false},
			{id: 'c', header: 'C', width: '68px'},
		];
		expect(gridTemplateColumns(cols)).toBe('1fr 68px');
		expect(visibleColumns(cols)).toHaveLength(2);
		expect(visibleColumns(cols)[0]?.id).toBe('a');
		expect(visibleColumns(cols)[1]?.id).toBe('c');
	});

	it('default schema has four columns', () => {
		expect(DEFAULT_GRID_COLUMNS).toHaveLength(4);
		expect(DEFAULT_GRID_COLUMNS[0]?.id).toBe('name');
		expect(DEFAULT_GRID_COLUMNS[1]?.id).toBe('start_date');
		expect(DEFAULT_GRID_COLUMNS[2]?.id).toBe('duration');
		expect(DEFAULT_GRID_COLUMNS[3]?.id).toBe('actions');
	});
});

describe('gridNaturalWidth', () => {
	it('default schema returns 306px (120 + 90 + 68 + 28)', () => {
		expect(gridNaturalWidth(DEFAULT_GRID_COLUMNS)).toBe(306);
	});

	it('sums fixed px columns', () => {
		const cols: GridColumn[] = [
			{id: 'a', header: 'A', width: '90px'},
			{id: 'b', header: 'B', width: '68px'},
			{id: 'c', header: 'C', width: '28px'},
		];
		expect(gridNaturalWidth(cols)).toBe(186);
	});

	it('converts fr units using GRID_COLUMN_FR_MIN_WIDTH', () => {
		const cols: GridColumn[] = [
			{id: 'name', header: 'Name', width: '1fr'},
			{id: 'start', header: 'Start', width: '90px'},
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
			{id: 'b', header: 'B', width: '68px', visible: false},
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
			{id: 'progress', header: 'Progress', width: '70px', field: 'progress'},
			{id: 'start_date', header: 'Start', width: '90px', field: 'start_date'},
			{id: 'duration', header: 'Days', width: '60px', field: 'duration'},
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
