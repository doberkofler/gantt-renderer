import {formatDisplayDate} from '../../domain/dateMath.ts';
import {type ChartLocale, EN_US_LABELS} from '../../locale.ts';
import {type Task} from '../../validation/schemas.ts';
import {type TaskNode} from '../../domain/tree.ts';

export type GridColumn = {
	id: string;
	header: string;
	width: string;
	align?: 'left' | 'center' | 'right';
	visible?: boolean;
	field?: keyof Task;
	format?: (value: unknown, task: Task, row: TaskNode, locale: ChartLocale) => string;
};

export const DEFAULT_GRID_COLUMNS: GridColumn[] = [
	{
		id: 'name',
		header: 'Task name',
		width: '1fr',
	},
	{
		id: 'start_date',
		header: 'Start time',
		width: '90px',
		field: 'start_date',
		format: (value, _task, _row, locale) => formatDisplayDate(String(value), locale),
	},
	{
		id: 'duration',
		header: 'Duration',
		width: '68px',
		field: 'duration',
		format: (value) => ((value as number) > 0 ? String(value) : '—'),
	},
	{
		id: 'actions',
		header: '',
		width: '28px',
	},
];

/**
 * Returns a localized default grid column schema.
 * Column headers use locale label overrides with `EN_US_LABELS` fallback.
 *
 * @param locale - The {@link ChartLocale} to derive column header labels from.
 * @returns An array of {@link GridColumn} objects.
 */
export function gridColumnDefaults(locale: ChartLocale): GridColumn[] {
	return [
		{
			id: 'name',
			header: locale.labels?.column_task_name ?? EN_US_LABELS.column_task_name,
			width: '1fr',
		},
		{
			id: 'start_date',
			header: locale.labels?.column_start_time ?? EN_US_LABELS.column_start_time,
			width: '90px',
			field: 'start_date',
			format: (value, _task, _row, loc) => formatDisplayDate(String(value), loc),
		},
		{
			id: 'duration',
			header: locale.labels?.column_duration ?? EN_US_LABELS.column_duration,
			width: '68px',
			field: 'duration',
			format: (value) => ((value as number) > 0 ? String(value) : '—'),
		},
		{
			id: 'actions',
			header: '',
			width: '28px',
		},
	];
}

/**
 * Builds a CSS `grid-template-columns` value from a column schema.
 *
 * @param columns - The full column schema array (only visible columns are included).
 * @returns A space-separated CSS track list.
 */
export function gridTemplateColumns(columns: GridColumn[]): string {
	return columns
		.filter((c) => c.visible !== false)
		.map((c) => c.width)
		.join(' ');
}

/**
 * Filters a column schema to only visible columns.
 *
 * @param columns - The full column schema array.
 * @returns A new array containing only columns where `visible` is not `false`.
 */
export function visibleColumns(columns: GridColumn[]): GridColumn[] {
	return columns.filter((c) => c.visible !== false);
}

export const GRID_COLUMN_FR_MIN_WIDTH = 120;

const PX_RE = /^(\d+(?:\.\d+)?)px$/;
const FR_RE = /^(\d+(?:\.\d+)?)fr$/;

function parseColumnMinWidth(width: string): number {
	const trimmed = width.trim();
	const pxMatch = PX_RE.exec(trimmed);
	if (pxMatch) {
		return parseFloat(pxMatch[1] ?? '0');
	}
	const frMatch = FR_RE.exec(trimmed);
	if (frMatch) {
		return parseFloat(frMatch[1] ?? '0') * GRID_COLUMN_FR_MIN_WIDTH;
	}
	return 0;
}

/**
 * Computes the minimum natural pixel width of a grid column schema.
 *
 * @param columns - The full column schema array.
 * @returns The sum of minimum widths: `px` columns sum directly, `fr` units contribute
 *          `GRID_COLUMN_FR_MIN_WIDTH` px each.
 */
export function gridNaturalWidth(columns: GridColumn[]): number {
	let total = 0;
	for (const col of visibleColumns(columns)) {
		total += parseColumnMinWidth(col.width);
	}
	return total;
}
