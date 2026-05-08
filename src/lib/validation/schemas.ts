import {z} from 'zod';

export const LinkTypeSchema = z.enum(['FS', 'SS', 'FF', 'SF']);
export const TaskKindSchema = z.enum(['task', 'project', 'milestone']);
export const SpecialDayKindSchema = z.enum(['holiday', 'custom']);

export const SpecialDaySchema = z.object({
	/** ISO date: YYYY-MM-DD */
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
	kind: SpecialDayKindSchema,
	label: z.string().min(1).optional(),
	className: z.string().min(1).optional(),
});

const taskBase = {
	/** Unique positive integer identifier for the task. */
	id: z.number().int().positive(),
	/** Display name / label of the task. */
	text: z.string().min(1),
	/** ISO date: YYYY-MM-DD */
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
	/** Optional id of the parent task. When set, this task is a child in the hierarchy. */
	parent: z.number().int().positive().optional(),
	/** Optional CSS color value for the task bar. Overrides the default color assignment. */
	color: z.string().optional(),
	/** Optional arbitrary metadata for consumer use. Preserved in the parsed output. */
	data: z.record(z.string(), z.unknown()).optional(),
};

export const TaskLeafSchema = z.object({
	...taskBase,
	kind: z.literal('task'),
	/** Duration in hours. Must be positive; use `kind: 'milestone'` for zero-duration points. */
	durationHours: z.number().int().positive(),
	/** 0–100 completion percentage (integer). */
	percentComplete: z.number().int().min(0).max(100).default(0),
});

export const TaskProjectSchema = z.object({
	...taskBase,
	kind: z.literal('project'),
	/** Duration in hours. Must be positive; use `kind: 'milestone'` for zero-duration points. */
	durationHours: z.number().int().positive(),
	/** 0–100 completion percentage (integer). */
	percentComplete: z.number().int().min(0).max(100).default(0),
	/**
	 * Initial expanded state for tree hierarchy.
	 * When `false`, children of this task are hidden on initial render.
	 *
	 * @default true
	 */
	open: z.boolean().default(true),
});

export const TaskMilestoneSchema = z.object({
	...taskBase,
	kind: z.literal('milestone'),
});

export const TaskSchema = z.discriminatedUnion('kind', [TaskLeafSchema, TaskProjectSchema, TaskMilestoneSchema]);

export const LinkSchema = z
	.object({
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
		/** Optional arbitrary metadata for consumer use. Preserved in the parsed output. */
		data: z.record(z.string(), z.unknown()).optional(),
	})
	.refine((l) => l.source !== l.target, {
		message: 'A link cannot connect a task to itself',
		path: ['target'],
	});

export const GanttInputSchema = z
	.object({
		/** Array of task objects. At least one task is required. */
		tasks: z.array(TaskSchema).min(1),
		/** Optional array of dependency link objects. Defaults to empty array. */
		links: z.array(LinkSchema).default([]),
	})
	.superRefine((data, ctx) => {
		// Duplicate task IDs
		const taskIds = new Set<number>();
		for (let i = 0; i < data.tasks.length; i++) {
			const task = data.tasks[i];
			if (task !== undefined) {
				if (taskIds.has(task.id)) {
					ctx.addIssue({
						code: 'custom',
						message: `Duplicate task id: ${task.id}`,
						path: ['tasks', i, 'id'],
					});
				}
				taskIds.add(task.id);
			}
		}

		// Duplicate link IDs
		const linkIds = new Set<number>();
		for (let i = 0; i < data.links.length; i++) {
			const link = data.links[i];
			if (link !== undefined) {
				if (linkIds.has(link.id)) {
					ctx.addIssue({
						code: 'custom',
						message: `Duplicate link id: ${link.id}`,
						path: ['links', i, 'id'],
					});
				}
				linkIds.add(link.id);
			}
		}

		// Duplicate (source, target) pairs
		const pairKeys = new Set<string>();
		for (let i = 0; i < data.links.length; i++) {
			const link = data.links[i];
			if (link !== undefined) {
				const key = `${link.source}:${link.target}`;
				if (pairKeys.has(key)) {
					ctx.addIssue({
						code: 'custom',
						message: `Duplicate link pair: source=${link.source} target=${link.target}`,
						path: ['links', i],
					});
				}
				pairKeys.add(key);
			}
		}
	});

/** The raw, unvalidated input shape that consumers pass to {@link parseGanttInput}. */
export type GanttInputRaw = z.input<typeof GanttInputSchema>;
/** Allowed dependency link type values: `'FS'`, `'SS'`, `'FF'`, or `'SF'`. */
export type LinkType = z.infer<typeof LinkTypeSchema>;
/** Allowed task kind values: `'task'`, `'project'`, or `'milestone'`. */
export type TaskKind = z.infer<typeof TaskKindSchema>;
export type SpecialDayKind = z.infer<typeof SpecialDayKindSchema>;
export type SpecialDay = z.infer<typeof SpecialDaySchema>;
/**
 * A task in the Gantt chart — discriminated by `kind` into leaf tasks,
 * summary projects, and milestones.
 *
 * - **`kind: 'task'`** — A regular task with a colored bar and duration.
 * - **`kind: 'project'`** — A summary/group row with a colored bar and optional tree state.
 * - **`kind: 'milestone'`** — A zero-duration marker rendered as a diamond.
 */
export type Task = z.infer<typeof TaskSchema>;
/** Convenience alias for the leaf-task variant of {@link Task}. */
export type TaskLeaf = z.infer<typeof TaskLeafSchema>;
/** Convenience alias for the project variant of {@link Task}. */
export type TaskProject = z.infer<typeof TaskProjectSchema>;
/** Convenience alias for the milestone variant of {@link Task}. */
export type TaskMilestone = z.infer<typeof TaskMilestoneSchema>;
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
