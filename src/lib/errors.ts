export type GanttErrorCode =
	| 'PARENT_REFERENCE'
	| 'PARENT_CYCLE'
	| 'LINK_REFERENCE'
	| 'DEPENDENCY_CYCLE'
	| 'MILESTONE_LINK_TYPE'
	| 'DUPLICATE_LINK_PAIR'
	| 'INSTANCE_DESTROYED';

/**
 * Domain-specific error with a machine-readable {@link GanttErrorCode}.
 */
export class GanttError extends Error {
	public readonly code: GanttErrorCode;

	/**
	 * @param code - A machine-readable {@link GanttErrorCode} categorising the error.
	 * @param message - A human-readable description.
	 */
	public constructor(code: GanttErrorCode, message: string) {
		super(message);
		this.name = 'GanttError';
		this.code = code;
	}
}
