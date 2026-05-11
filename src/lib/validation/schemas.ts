import {z} from 'zod';

export const LinkTypeSchema = z.enum(['FS', 'SS', 'FF', 'SF']);
export const TaskKindSchema = z.enum(['task', 'project', 'milestone']);
export const SpecialDayKindSchema = z.enum(['holiday', 'custom']);

export const SpecialDaySchema = z.object({
	/** ISO date: YYYY-MM-DD */
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD'),
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
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD'),
	/** Optional id of the parent task. When set, this task is a child in the hierarchy. */
	parent: z.number().int().positive().optional(),
	/** Optional CSS color value for the task bar. Overrides the default color assignment. */
	color: z.string().optional(),
	/** When `true`, the task bar cannot be dragged or resized. */
	readonly: z.boolean().optional(),
	/** Optional arbitrary metadata for consumer use. Preserved in the parsed output. */
	data: z.record(z.string(), z.unknown()).optional(),
};

/** @internal */
export const TaskLeafSchema = z
	.object({
		...taskBase,
		kind: z.literal('task'),
		/** ISO date: YYYY-MM-DD */
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD'),
		/** 0–100 completion percentage (integer). */
		percentComplete: z.number().int().min(0).max(100).default(0),
	})
	.refine((t) => t.endDate >= t.startDate, {message: 'endDate must be on or after startDate', path: ['endDate']});

/** @internal */
export const TaskProjectSchema = z
	.object({
		...taskBase,
		kind: z.literal('project'),
		/** ISO date: YYYY-MM-DD */
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected YYYY-MM-DD'),
		/** 0–100 completion percentage (integer). */
		percentComplete: z.number().int().min(0).max(100).default(0),
		/**
		 * Initial expanded state for tree hierarchy.
		 * When `false`, children of this task are hidden on initial render.
		 *
		 * @default true
		 */
		open: z.boolean().default(true),
	})
	.refine((t) => t.endDate >= t.startDate, {message: 'endDate must be on or after startDate', path: ['endDate']});

/** @internal */
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
		/** When `true`, the link cannot be modified or deleted through the UI. */
		readonly: z.boolean().optional(),
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

// ─── Internal zod-inferred types (runtime shapes, include data?: Record<string, unknown>) ───

/** @internal */
export type ZodTaskInferred = z.infer<typeof TaskSchema>;
/** @internal */
export type ZodLinkInferred = z.infer<typeof LinkSchema>;

// ─── Public generic types ───

/**
 * Conditional data property helper.
 * When `T` is `never`, adds nothing. Otherwise adds `{data?: T | undefined}`.
 */
type WithData<T> = [T] extends [never] ? Record<never, never> : {data?: T | undefined};

/**
 * Distributes `Omit` over union members so variant-specific properties
 * (e.g. `endDate`, `percentComplete`, `open`) are preserved in discriminated unions.
 */
type WithoutData<T> = T extends unknown ? Omit<T, 'data'> : never;

/**
 * A task in the Gantt chart &mdash; discriminated by `kind` into leaf tasks,
 * summary projects, and milestones.
 *
 * @param TData - The type of the optional `data` property. Defaults to `never`,
 * which omits the `data` property from the type. Specify a concrete type to enable
 * compile-time-checked task data in both input and callback payloads.
 *
 * @example
 * ```ts
 * // Default: no `data` property
 * const task: Task = { id: 1, text: 'Build', startDate: '2026-01-01', endDate: '2026-01-03', kind: 'task' };
 *
 * // With typed data
 * interface TaskMeta { priority: number; label: string }
 * const typedTask: Task<TaskMeta> = {
 *   id: 1, text: 'Build', startDate: '2026-01-01', endDate: '2026-01-03',
 *   kind: 'task', data: { priority: 1, label: 'critical' }
 * };
 * ```
 */
export type Task<TData = never> = WithoutData<ZodTaskInferred> & WithData<TData>;

/**
 * A dependency link between two tasks.
 *
 * @param TData - The type of the optional `data` property. Defaults to `never`.
 */
export type Link<TData = never> = WithoutData<ZodLinkInferred> & WithData<TData>;

/**
 * The complete input data for the chart.
 *
 * @param TTaskData - The type of the `data` property on tasks. Defaults to `never`.
 * @param TLinkData - The type of the `data` property on links. Defaults to `never`.
 */
export type GanttInput<TTaskData = never, TLinkData = never> = {
	tasks: Task<TTaskData>[];
	links: Link<TLinkData>[];
};

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type _GanttInputZod = z.infer<typeof GanttInputSchema>;

/** The raw, unvalidated input shape that consumers pass to {@link parseGanttInput}. */
export type GanttInputRaw = z.input<typeof GanttInputSchema>;
/** Allowed dependency link type values: `'FS'`, `'SS'`, `'FF'`, or `'SF'`. */
export type LinkType = z.infer<typeof LinkTypeSchema>;
/** Allowed task kind values: `'task'`, `'project'`, or `'milestone'`. */
export type TaskKind = z.infer<typeof TaskKindSchema>;
export type SpecialDayKind = z.infer<typeof SpecialDayKindSchema>;
export type SpecialDay = z.infer<typeof SpecialDaySchema>;
/** @internal */
export type TaskLeafInferred = z.infer<typeof TaskLeafSchema>;
/** @internal */
export type TaskProjectInferred = z.infer<typeof TaskProjectSchema>;
/** @internal */
export type TaskMilestoneInferred = z.infer<typeof TaskMilestoneSchema>;

/**
 * Parses raw external data.
 *
 * @param raw - The unvalidated input from the consumer.
 * @returns The parsed and validated input with `data` typed as `Record<string, unknown>`.
 * @throws {import('zod').ZodError} On schema validation failure.
 */
export function parseGanttInput(raw: GanttInputRaw): GanttInput<Record<string, unknown>, Record<string, unknown>> {
	return GanttInputSchema.parse(raw);
}
