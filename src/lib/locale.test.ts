import {describe, expect, it} from 'vitest';
import {
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
import {ALL_LOCALES} from './locales/all.ts';

describe('EN_US_LABELS', () => {
	it('covers all LocaleLabelKey entries', () => {
		const keys: LocaleLabelKey[] = [
			'ariaTask',
			'ariaMilestone',
			'addSubtaskTitle',
			'columnTaskName',
			'columnStartDate',
			'columnEndDate',
			'columnDuration',
			'columnQuarter',
		];
		for (const key of keys) {
			expect(EN_US_LABELS[key]).toBeTypeOf('string');
		}
	});

	it('has canonical English defaults', () => {
		expect(EN_US_LABELS.ariaTask).toBe('Task {0}');
		expect(EN_US_LABELS.ariaMilestone).toBe('Milestone {0}');
		expect(EN_US_LABELS.addSubtaskTitle).toBe('Add subtask');
		expect(EN_US_LABELS.columnTaskName).toBe('Task name');
		expect(EN_US_LABELS.columnStartDate).toBe('Start');
		expect(EN_US_LABELS.columnEndDate).toBe('End');
		expect(EN_US_LABELS.columnQuarter).toBe('Q');
	});
});

describe('resolveChartLocale', () => {
	it('returns a default en locale when undefined', () => {
		const result = resolveChartLocale(undefined);
		expect(result.code).toBe('en');
		expect(result.weekStartsOn).toBe(0);
		expect(result.weekNumbering).toBe('iso');
		expect(result.weekendDays).toStrictEqual([0, 6]);
		expect(result.labels?.ariaTask).toBe('Task {0}');
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
		expect(locale.weekendDays).toStrictEqual([5, 6]);
	});

	it('preserves labels when provided', () => {
		const input: ChartLocale = {code: 'en', labels: {addSubtaskTitle: 'Add child'}};
		const locale = resolveChartLocale(input);
		expect(locale.labels?.addSubtaskTitle).toBe('Add child');
	});

	it('does not set labels when not provided', () => {
		const input: ChartLocale = {code: 'en'};
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
		expect(deriveWeekendDays('en-US')).toStrictEqual([0, 6]);
	});

	it('returns Fri/Sat for ar-SA', () => {
		expect(deriveWeekendDays('ar-SA')).toStrictEqual([5, 6]);
	});

	it('returns Fri/Sat for ar-AE', () => {
		expect(deriveWeekendDays('ar-AE')).toStrictEqual([5, 6]);
	});

	it('returns Fri/Sun for ms-BN', () => {
		expect(deriveWeekendDays('ms-BN')).toStrictEqual([0, 5]);
	});

	it('returns Sunday only for en-IN', () => {
		expect(deriveWeekendDays('en-IN')).toStrictEqual([0]);
	});

	it('returns Friday only for fa-IR', () => {
		expect(deriveWeekendDays('fa-IR')).toStrictEqual([5]);
	});

	it('returns Sat/Sun for unknown locale', () => {
		expect(deriveWeekendDays('xx-XX')).toStrictEqual([0, 6]);
	});

	it('returns Sat/Sun for de-DE', () => {
		expect(deriveWeekendDays('de-DE')).toStrictEqual([0, 6]);
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

	it('returns a valid scheme for language-only de (via getWeekInfo or default)', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('de'));
	});

	it('returns a valid scheme for unknown region xx-XX (falls to getWeekInfo or default)', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('xx-XX'));
	});

	it('returns a valid scheme for language-only code', () => {
		expect(['iso', 'us', 'simple']).toContain(deriveWeekNumbering('en'));
	});

	it('returns "us" for es-EC (EC in WEEK_START_REGION but not in WEEK_NUMBERING_REGION)', () => {
		expect(deriveWeekNumbering('es-EC')).toBe('us');
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

describe('shipped locales', () => {
	const ALL_LABEL_KEYS: LocaleLabelKey[] = [
		'ariaTask',
		'ariaMilestone',
		'addSubtaskTitle',
		'columnTaskName',
		'columnStartDate',
		'columnEndDate',
		'columnDuration',
		'columnQuarter',
	];

	const EXPECTED_CODES = [
		'en',
		'zh-Hans',
		'zh-Hant',
		'es',
		'pt-BR',
		'pt-PT',
		'fr',
		'de',
		'ru',
		'ja',
		'ko',
		'ar',
		'hi',
		'id',
		'th',
		'tr',
		'it',
		'pl',
		'nl',
		'sv',
		'da',
		'nb',
		'fi',
		'uk',
		'ro',
		'cs',
		'hu',
		'el',
		'sk',
		'bg',
		'hr',
		'sr',
		'lt',
		'lv',
		'et',
		'sl',
		'be',
		'sq',
		'mk',
		'ca',
		'eu',
		'cy',
		'ga',
		'mt',
	];

	it('contains all expected locale codes', () => {
		const codes = new Set(EXPECTED_CODES);
		for (const code of ALL_LOCALES.keys()) {
			expect(codes.has(code), `unexpected locale code: ${code}`).toBe(true);
		}
		for (const code of EXPECTED_CODES) {
			expect(ALL_LOCALES.has(code), `missing locale code: ${code}`).toBe(true);
		}
	});

	it('each shipped locale covers all LocaleLabelKey entries', () => {
		for (const locale of ALL_LOCALES.values()) {
			for (const key of ALL_LABEL_KEYS) {
				expect(locale.labels?.[key], `${locale.code}: missing label key "${key}"`).toBeTypeOf('string');
			}
		}
	});

	it('each shipped locale has valid weekStartsOn', () => {
		for (const locale of ALL_LOCALES.values()) {
			expect([0, 1, 6], `${locale.code}: invalid weekStartsOn`).toContain(locale.weekStartsOn);
		}
	});

	it('each shipped locale has valid weekendDays', () => {
		for (const locale of ALL_LOCALES.values()) {
			expect(locale.weekendDays, `${locale.code}: missing weekendDays`).toBeDefined();
			expect(locale.weekendDays?.length, `${locale.code}: empty weekendDays`).toBeGreaterThan(0);
			for (const day of locale.weekendDays ?? []) {
				expect(day, `${locale.code}: invalid weekend day`).toBeGreaterThanOrEqual(0);
				expect(day, `${locale.code}: invalid weekend day`).toBeLessThanOrEqual(6);
			}
		}
	});

	it('resolveChartLocale preserves labels from shipped locales', () => {
		for (const locale of ALL_LOCALES.values()) {
			const resolved = resolveChartLocale(locale);
			expect(resolved.code).toBe(locale.code);
			for (const key of ALL_LABEL_KEYS) {
				expect(resolved.labels?.[key], `${locale.code}: missing resolved label "${key}"`).toBe(locale.labels?.[key]);
			}
		}
	});
});
