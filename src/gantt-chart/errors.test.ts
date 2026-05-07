import {describe, expect, it} from 'vitest';
import {GanttError} from './errors.ts';

describe('GanttError', () => {
	it('creates error with code and message', () => {
		const err = new GanttError('PARENT_REFERENCE', 'Bad parent');
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(GanttError);
		expect(err.name).toBe('GanttError');
		expect(err.code).toBe('PARENT_REFERENCE');
		expect(err.message).toBe('Bad parent');
	});

	it('supports all GanttErrorCode values', () => {
		const codes = ['PARENT_REFERENCE', 'LINK_REFERENCE', 'DEPENDENCY_CYCLE', 'INSTANCE_DESTROYED'] as const;
		for (const code of codes) {
			const err = new GanttError(code, `Error: ${code}`);
			expect(err.code).toBe(code);
			expect(err.name).toBe('GanttError');
		}
	});
});
