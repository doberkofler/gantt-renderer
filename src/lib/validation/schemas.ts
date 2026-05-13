import {z} from 'zod';

export const LinkTypeSchema = z.enum(['FS', 'SS', 'FF', 'SF']);
export const TaskKindSchema = z.enum(['task', 'project', 'milestone']);
const SpecialDayKindSchema = z.enum(['holiday', 'custom']);

/** @internal */
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
const TaskLeafSchema = z
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
const TaskProjectSchema = z
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
const TaskMilestoneSchema = z.object({
	...taskBase,
	kind: z.literal('milestone'),
});

const TaskSchema = z.discriminatedUnion('kind', [TaskLeafSchema, TaskProjectSchema, TaskMilestoneSchema]);

const LinkSchema = z
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

/** @internal */
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
export type Task<TData = never> =
	| {
			id: number;
			text: string;
			startDate: string;
			parent?: number | undefined;
			color?: string | undefined;
			readonly?: boolean | undefined;
			data?: unknown;
			kind: 'task';
			endDate: string;
			percentComplete: number;
	  }
	| {
			id: number;
			text: string;
			startDate: string;
			parent?: number | undefined;
			color?: string | undefined;
			readonly?: boolean | undefined;
			data?: unknown;
			kind: 'project';
			endDate: string;
			percentComplete: number;
			open: boolean;
	  }
	| {
			id: number;
			text: string;
			startDate: string;
			parent?: number | undefined;
			color?: string | undefined;
			readonly?: boolean | undefined;
			data?: unknown;
			kind: 'milestone';
	  } extends infer _U
	? _U extends unknown
		? Omit<_U, 'data'> &
				([TData] extends [never]
					? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
						Record<never, never>
					: {data?: TData | undefined})
		: never
	: never;

/**
 * A dependency link between two tasks.
 *
 * @param TData - The type of the optional `data` property. Defaults to `never`.
 */
export type Link<TData = never> = {
	id: number;
	source: number;
	target: number;
	type: LinkType;
	readonly?: boolean | undefined;
} & ([TData] extends [never]
	? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
		Record<never, never>
	: {data?: TData | undefined});

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

/**
 * The raw input shape that consumers pass to {@link GanttChart.update}.
 *
 * Fields with defaults in the schema (e.g. `percentComplete`, `type`) remain optional here.
 *
 * @param TTaskData - The type of the `data` property on tasks. Defaults to `never`.
 * @param TLinkData - The type of the `data` property on links. Defaults to `never`.
 */
export type GanttInputRaw<TTaskData = never, TLinkData = never> = {
	tasks: readonly (
		| {
				id: number;
				text: string;
				startDate: string;
				parent?: number | undefined;
				color?: string | undefined;
				readonly?: boolean | undefined;
				data?: unknown;
				kind: 'task';
				endDate: string;
				percentComplete?: number | undefined;
		  }
		| {
				id: number;
				text: string;
				startDate: string;
				parent?: number | undefined;
				color?: string | undefined;
				readonly?: boolean | undefined;
				data?: unknown;
				kind: 'project';
				endDate: string;
				percentComplete?: number | undefined;
				open?: boolean | undefined;
		  }
		| {
				id: number;
				text: string;
				startDate: string;
				parent?: number | undefined;
				color?: string | undefined;
				readonly?: boolean | undefined;
				data?: unknown;
				kind: 'milestone';
		  } extends infer _RU
		? _RU extends unknown
			? Omit<_RU, 'data'> &
					([TTaskData] extends [never]
						? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
							Record<never, never>
						: {data?: TTaskData | undefined})
			: never
		: never)[];
	links?: readonly ({
		id: number;
		source: number;
		target: number;
		type?: LinkType | undefined;
		readonly?: boolean | undefined;
	} & ([TLinkData] extends [never]
		? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
			Record<never, never>
		: {data?: TLinkData | undefined}))[];
};
/** Allowed dependency link type values: `'FS'`, `'SS'`, `'FF'`, or `'SF'`. */
export type LinkType = 'FS' | 'SS' | 'FF' | 'SF';
/** Allowed task kind values: `'task'`, `'project'`, or `'milestone'`. */
export type TaskKind = 'task' | 'project' | 'milestone';
export type SpecialDayKind = 'holiday' | 'custom';
export type SpecialDay = {
	/** ISO date: YYYY-MM-DD */
	date: string;
	kind: SpecialDayKind;
	label?: string | undefined;
	className?: string | undefined;
};
/** @internal */
export type TaskLeafInferred = z.infer<typeof TaskLeafSchema>;
/** @internal */
export type TaskProjectInferred = z.infer<typeof TaskProjectSchema>;
/** @internal */
export type TaskMilestoneInferred = z.infer<typeof TaskMilestoneSchema>;
