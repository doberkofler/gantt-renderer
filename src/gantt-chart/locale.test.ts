import {describe, expect, it} from 'vitest';
import {
	CHART_LOCALE_EN_US,
	EN_US_LABELS,
	resolveChartLocale,
	deriveWeekStartsOn,
	deriveWeekendDays,
	deriveWeekNumbering,
	formatWeekNumber,
	formatLabel,
	type ChartLocale,
	type LocaleLabelKey,
} from './locale.ts';

describe('EN_US_LABELS', () => {
	it('covers all LocaleLabelKey entries', () => {
		const keys: LocaleLabelKey[] = ['ariaTask', 'ariaMilestone', 'addSubtaskTitle', 'columnTaskName', 'columnStartDate', 'columnDuration', 'columnQuarter'];
		for (const key of keys) {
			expect(EN_US_LABELS[key]).toBeTypeOf('string');
		}
	});

	it('has canonical English defaults', () => {
		expect(EN_US_LABELS.ariaTask).toBe('Task {0}');
		expect(EN_US_LABELS.ariaMilestone).toBe('Milestone {0}');
		expect(EN_US_LABELS.addSubtaskTitle).toBe('Add subtask');
		expect(EN_US_LABELS.columnTaskName).toBe('Task name');
		expect(EN_US_LABELS.columnStartDate).toBe('Start time');
		expect(EN_US_LABELS.columnDuration).toBe('Duration');
		expect(EN_US_LABELS.columnQuarter).toBe('Q');
	});
});

describe('CHART_LOCALE_EN_US', () => {
	it('has code en-US', () => {
		expect(CHART_LOCALE_EN_US.code).toBe('en-US');
	});

	it('has ISO week numbering for backward compat with pre-i18n rendering', () => {
		expect(CHART_LOCALE_EN_US.weekStartsOn).toBe(0);
		expect(CHART_LOCALE_EN_US.weekNumbering).toBe('iso');
	});

	it('has EN_US_LABELS as labels', () => {
		expect(CHART_LOCALE_EN_US.labels).toBe(EN_US_LABELS);
	});
});

describe('resolveChartLocale', () => {
	it('returns CHART_LOCALE_EN_US when undefined', () => {
		expect(resolveChartLocale(undefined)).toBe(CHART_LOCALE_EN_US);
	});

	it('resolves from a BCP 47 string (de-DE → ISO/Monday)', () => {
		const locale = resolveChartLocale('de-DE');
		expect(locale.code).toBe('de-DE');
		expect(locale.weekStartsOn).toBe(1);
	});

	it('resolves from a full ChartLocale object', () => {
		const input: ChartLocale = {code: 'fr-FR', weekStartsOn: 1, weekNumbering: 'iso', weekendDays: [0, 6]};
		const locale = resolveChartLocale(input);
		expect(locale.code).toBe('fr-FR');
		expect(locale.weekStartsOn).toBe(1);
		expect(locale.weekNumbering).toBe('iso');
	});

	it('fills in missing fields from CLDR derivation', () => {
		const input: ChartLocale = {code: 'de-DE'};
		const locale = resolveChartLocale(input);
		expect(locale.weekStartsOn).toBe(1);
	});

	it('preserves explicit field values from ChartLocale object', () => {
		const input: ChartLocale = {code: 'de-DE', weekStartsOn: 0, weekendDays: [5, 6]};
		const locale = resolveChartLocale(input);
		expect(locale.weekStartsOn).toBe(0);
		expect(locale.weekendDays).toEqual([5, 6]);
	});

	it('preserves labels when provided', () => {
		const input: ChartLocale = {code: 'en-US', labels: {addSubtaskTitle: 'Add child'}};
		const locale = resolveChartLocale(input);
		expect(locale.labels?.addSubtaskTitle).toBe('Add child');
	});

	it('does not set labels when not provided', () => {
		const input: ChartLocale = {code: 'en-US'};
		const locale = resolveChartLocale(input);
		expect(locale.labels).toBeUndefined();
	});
});

describe('deriveWeekStartsOn', () => {
	it('returns 0 for en-US (Sunday start, via US region)', () => {
		expect(deriveWeekStartsOn('en-US')).toBe(0);
	});

	it('returns 1 for de-DE (Monday start)', () => {
		expect(deriveWeekStartsOn('de-DE')).toBe(1);
	});

	it('returns 0 for ar-SA (Sunday start, via SA region)', () => {
		expect(deriveWeekStartsOn('ar-SA')).toBe(0);
	});

	it('returns 6 for ar (Arabic without region, via lang table)', () => {
		expect(deriveWeekStartsOn('ar')).toBe(6);
	});

	it('returns 6 for fa (Farsi, via lang table)', () => {
		expect(deriveWeekStartsOn('fa')).toBe(6);
	});

	it('returns 1 for unknown locale (default fallback)', () => {
		expect(deriveWeekStartsOn('xx-XX')).toBe(1);
	});

	it('returns 1 for fr-FR (Monday start)', () => {
		expect(deriveWeekStartsOn('fr-FR')).toBe(1);
	});
});

describe('deriveWeekendDays', () => {
	it('returns weekend days in sorted order', () => {
		expect(deriveWeekendDays('en-US')).toEqual([0, 6]);
	});

	it('returns Fri/Sat for ar-SA', () => {
		expect(deriveWeekendDays('ar-SA')).toEqual([5, 6]);
	});

	it('returns Fri/Sat for ar-AE', () => {
		expect(deriveWeekendDays('ar-AE')).toEqual([5, 6]);
	});

	it('returns Fri/Sun for ms-BN', () => {
		expect(deriveWeekendDays('ms-BN')).toEqual([0, 5]);
	});

	it('returns Sunday only for en-IN', () => {
		expect(deriveWeekendDays('en-IN')).toEqual([0]);
	});

	it('returns Friday only for fa-IR', () => {
		expect(deriveWeekendDays('fa-IR')).toEqual([5]);
	});

	it('returns Sat/Sun for unknown locale', () => {
		expect(deriveWeekendDays('xx-XX')).toEqual([0, 6]);
	});

	it('returns Sat/Sun for de-DE', () => {
		expect(deriveWeekendDays('de-DE')).toEqual([0, 6]);
	});
});

describe('deriveWeekNumbering', () => {
	it('returns "us" for en-US (region table hit)', () => {
		expect(deriveWeekNumbering('en-US')).toBe('us');
	});

	it('returns "us" for en-CA (CA in region table)', () => {
		expect(deriveWeekNumbering('en-CA')).toBe('us');
	});

	it('returns "us" for ar-SA (SA uses Sunday start → US scheme)', () => {
		expect(deriveWeekNumbering('ar-SA')).toBe('us');
	});

	it('returns "us" for ar-AE (AE in region table)', () => {
		expect(deriveWeekNumbering('ar-AE')).toBe('us');
	});

	it('returns a valid scheme for European locale de-DE', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('de-DE'));
	});

	it('returns a valid scheme for unknown region xx-XX (falls to getWeekInfo or default)', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('xx-XX'));
	});

	it('returns a valid scheme for language-only code', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('en'));
	});
});

describe('formatWeekNumber', () => {
	it('iso: 2026-01-01 is week 1 (Thursday is Jan 1)', () => {
		const d = new Date('2026-01-01T00:00:00.000Z');
		expect(formatWeekNumber(d, 'iso')).toBe(1);
	});

	it('iso: 2026-03-10 is week 11', () => {
		const d = new Date('2026-03-10T00:00:00.000Z');
		expect(formatWeekNumber(d, 'iso')).toBe(11);
	});

	it('iso: 2025-12-29 is ISO week 1 of 2026 (Monday)', () => {
		const d = new Date('2025-12-29T00:00:00.000Z');
		expect(formatWeekNumber(d, 'iso')).toBe(1);
	});

	it('iso: 2025-12-28 (Sunday) is ISO week 52 of 2025', () => {
		const d = new Date('2025-12-28T00:00:00.000Z');
		expect(formatWeekNumber(d, 'iso')).toBe(52);
	});

	it('us: 2026-01-01 (Thursday) — week 1 (week contains Jan 1, starts Dec 28)', () => {
		const d = new Date('2026-01-01T00:00:00.000Z');
		expect(formatWeekNumber(d, 'us')).toBe(1);
	});

	it('us: 2026-01-03 (Saturday) — still week 1', () => {
		const d = new Date('2026-01-03T00:00:00.000Z');
		expect(formatWeekNumber(d, 'us')).toBe(1);
	});

	it('us: 2026-01-04 (Sunday) — week 2 starts', () => {
		const d = new Date('2026-01-04T00:00:00.000Z');
		expect(formatWeekNumber(d, 'us')).toBe(2);
	});

	it('simple: Jan 1 = week 1', () => {
		const d = new Date('2026-01-01T00:00:00.000Z');
		expect(formatWeekNumber(d, 'simple')).toBe(1);
	});

	it('simple: Jan 7 = week 1', () => {
		const d = new Date('2026-01-07T00:00:00.000Z');
		expect(formatWeekNumber(d, 'simple')).toBe(1);
	});

	it('simple: Jan 8 = week 2', () => {
		const d = new Date('2026-01-08T00:00:00.000Z');
		expect(formatWeekNumber(d, 'simple')).toBe(2);
	});

	it('simple: Dec 31 = week 53', () => {
		const d = new Date('2026-12-31T00:00:00.000Z');
		expect(formatWeekNumber(d, 'simple')).toBe(53);
	});
});

describe('formatLabel', () => {
	it('replaces {0} with the given argument', () => {
		expect(formatLabel('Task {0}', 'My Task')).toBe('Task My Task');
	});

	it('replaces multiple occurrences of {0}', () => {
		expect(formatLabel('{0} is {0}', 'X')).toBe('X is X');
	});

	it('leaves template unchanged when there is no {0}', () => {
		expect(formatLabel('No placeholder', 'arg')).toBe('No placeholder');
	});
});
