export type GanttErrorCode = 'PARENT_REFERENCE' | 'LINK_REFERENCE' | 'DEPENDENCY_CYCLE' | 'INSTANCE_DESTROYED';

export class GanttError extends Error {
	public readonly code: GanttErrorCode;

	public constructor(code: GanttErrorCode, message: string) {
		super(message);
		this.name = 'GanttError';
		this.code = code;
	}
}
