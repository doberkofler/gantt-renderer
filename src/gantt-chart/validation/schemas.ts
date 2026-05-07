import {z} from 'zod';

export const LinkTypeSchema = z.enum(['FS', 'SS', 'FF', 'SF']);
export const TaskTypeSchema = z.enum(['task', 'project', 'milestone']);
export const SpecialDayKindSchema = z.enum(['holiday', 'custom']);

export const SpecialDaySchema = z.object({
	/** ISO date: YYYY-MM-DD */
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
	kind: SpecialDayKindSchema,
	label: z.string().min(1).optional(),
	className: z.string().min(1).optional(),
});

export const TaskSchema = z.object({
	/** Unique positive integer identifier for the task. */
	id: z.number().int().positive(),
	/** Display name / label of the task. */
	text: z.string().min(1),
	/** ISO date: YYYY-MM-DD */
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
	/** Duration in hours; 0 = milestone */
	durationHours: z.number().int().min(0),
	/** Optional id of the parent task. When set, this task is a child in the hierarchy. */
	parent: z.number().int().positive().optional(),
	/** 0–100 completion percentage (integer) */
	percentComplete: z.number().int().min(0).max(100).default(0),
	/**
	 * Task type: `'task'`, `'project'`, or `'milestone'`.
	 *
	 * - `'task'` — A regular task with a colored bar.
	 * - `'project'` — A summary/group row with a colored bar.
	 * - `'milestone'` — A zero-duration marker rendered as a diamond.
	 *
	 * @default 'task'
	 */
	type: TaskTypeSchema.default('task'),
	/**
	 * Initial expanded state for tree hierarchy.
	 * When `false`, children of this task are hidden on initial render.
	 * Only relevant for tasks with child tasks.
	 *
	 * @default true
	 */
	open: z.boolean().default(true),
	/** Optional CSS color value for the task bar. Overrides the default color assignment. */
	color: z.string().optional(),
});

export const LinkSchema = z.object({
	/** Unique positive integer identifier for the dependency link. */
	id: z.number().int().positive(),
	/** The `id` of the predecessor task (the task that drives the dependency). */
	source: z.number().int().positive(),
	/** The `id` of the successor task (the task that depends on the predecessor). */
	target: z.number().int().positive(),
	/**
	 * Dependency type.
	 *
	 * - `'FS'` — Finish-to-start: successor starts after predecessor finishes.
	 * - `'SS'` — Start-to-start: successor starts at the same time as predecessor.
	 * - `'FF'` — Finish-to-finish: successor finishes at the same time as predecessor.
	 * - `'SF'` — Start-to-finish: successor finishes after predecessor starts.
	 *
	 * @default 'FS'
	 */
	type: LinkTypeSchema.default('FS'),
});

export const GanttInputSchema = z.object({
	/** Array of task objects. At least one task is required. */
	tasks: z.array(TaskSchema).min(1),
	/** Optional array of dependency link objects. Defaults to empty array. */
	links: z.array(LinkSchema).default([]),
});

/** The raw, unvalidated input shape that consumers pass to {@link parseGanttInput}. */
export type GanttInputRaw = z.input<typeof GanttInputSchema>;
/** Allowed dependency link type values: `'FS'`, `'SS'`, `'FF'`, or `'SF'`. */
export type LinkType = z.infer<typeof LinkTypeSchema>;
/** Allowed task type values: `'task'`, `'project'`, or `'milestone'`. */
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type SpecialDayKind = z.infer<typeof SpecialDayKindSchema>;
export type SpecialDay = z.infer<typeof SpecialDaySchema>;
/**
 * A project task in the Gantt chart. Defines timing (start date, duration in hours),
 * hierarchy (parent id), and visual properties (type, percentComplete, color).
 */
export type Task = z.infer<typeof TaskSchema>;
/**
 * A dependency link between two tasks. The `type` determines the scheduling constraint
 * (e.g., finish-to-start, start-to-start).
 */
export type Link = z.infer<typeof LinkSchema>;
/**
 * The complete input data for the chart.
 *
 * Pass a raw plain object (typed as {@link GanttInputRaw}) to
 * {@link parseGanttInput} to validate and get back a typed {@link GanttInput}.
 */
export type GanttInput = z.infer<typeof GanttInputSchema>;

/**
 * Parses raw external data.
 *
 * @param raw - The unvalidated input from the consumer.
 * @returns The parsed and validated {@link GanttInput}.
 * @throws {import('zod').ZodError} On schema validation failure.
 */
export function parseGanttInput(raw: GanttInputRaw): GanttInput {
	return GanttInputSchema.parse(raw);
}

/**
 * Parses without throwing; returns `null` on validation failure.
 *
 * @param raw - The unvalidated input from the consumer.
 * @returns The parsed {@link GanttInput} or `null` when the input is invalid.
 */
export function safeParseGanttInput(raw: GanttInputRaw): GanttInput | null {
	const result = GanttInputSchema.safeParse(raw);
	return result.success ? result.data : null;
}
