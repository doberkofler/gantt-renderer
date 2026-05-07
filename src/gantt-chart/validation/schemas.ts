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
	id: z.number().int().positive(),
	text: z.string().min(1),
	/** ISO date: YYYY-MM-DD */
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
	/** Duration in days; 0 = milestone */
	duration: z.number().int().min(0),
	parent: z.number().int().positive().optional(),
	/** 0–1 completion ratio */
	progress: z.number().min(0).max(1).default(0),
	type: TaskTypeSchema.default('task'),
	/** Initial expanded state (only relevant for parent nodes) */
	open: z.boolean().default(true),
	color: z.string().optional(),
});

export const LinkSchema = z.object({
	id: z.number().int().positive(),
	source: z.number().int().positive(),
	target: z.number().int().positive(),
	type: LinkTypeSchema.default('FS'),
});

export const GanttInputSchema = z.object({
	tasks: z.array(TaskSchema).min(1),
	links: z.array(LinkSchema).default([]),
});

export type LinkType = z.infer<typeof LinkTypeSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type SpecialDayKind = z.infer<typeof SpecialDayKindSchema>;
export type SpecialDay = z.infer<typeof SpecialDaySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type GanttInput = z.infer<typeof GanttInputSchema>;

/**
 * Parses raw external data.
 *
 * @param raw - The unvalidated input from the consumer.
 * @returns The parsed and validated {@link GanttInput}.
 * @throws {import('zod').ZodError} On schema validation failure.
 */
export function parseGanttInput(raw: unknown): GanttInput {
	return GanttInputSchema.parse(raw);
}

/**
 * Parses without throwing; returns `null` on validation failure.
 *
 * @param raw - The unvalidated input from the consumer.
 * @returns The parsed {@link GanttInput} or `null` when the input is invalid.
 */
export function safeParseGanttInput(raw: unknown): GanttInput | null {
	const result = GanttInputSchema.safeParse(raw);
	return result.success ? result.data : null;
}
