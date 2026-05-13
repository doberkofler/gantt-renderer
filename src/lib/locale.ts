export type LocaleLabelKey =
	| 'ariaTask'
	| 'ariaMilestone'
	| 'addSubtaskTitle'
	| 'columnTaskName'
	| 'columnStartDate'
	| 'columnEndDate'
	| 'columnDuration'
	| 'columnQuarter';

export type ChartLocale = {
	code: string;
	labels?: Partial<Record<LocaleLabelKey, string>>;
	weekStartsOn?: 0 | 1 | 6;
	weekNumbering?: 'iso' | 'us' | 'simple';
	weekendDays?: number[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntlLocaleWithWeekInfo = Intl.Locale & {getWeekInfo?: () => {firstDay: number; weekend: number[]; minimalDays: number}};

const WEEK_START_REGION: Record<string, 0 | 1 | 6> = {
	US: 0,
	CA: 0,
	MX: 0,
	JP: 0,
	PH: 0,
	BR: 0,
	CO: 0,
	VE: 0,
	PE: 0,
	EC: 0,
	CL: 0,
	AR: 0,
	UY: 0,
	PY: 0,
	BO: 0,
	GT: 0,
	HN: 0,
	SV: 0,
	NI: 0,
	CR: 0,
	PA: 0,
	DO: 0,
	PR: 0,
	IL: 0,
	SA: 0,
	KW: 0,
	QA: 0,
	BH: 0,
	OM: 0,
	YE: 0,
	MA: 0,
	DZ: 0,
	TN: 0,
	LY: 0,
	EG: 0,
	IQ: 0,
	JO: 0,
	SD: 0,
	SY: 0,
	LB: 0,
	PS: 0,
	AE: 6,
	IR: 6,
	AF: 6,
	DJ: 6,
	SO: 6,
};

const WEEK_START_LANG: Record<string, 0 | 1 | 6> = {
	ar: 6,
	fa: 6,
};

const WEEK_NUMBERING_REGION: Record<string, 'iso' | 'us'> = {
	US: 'us',
	CA: 'us',
	MX: 'us',
	BR: 'us',
	AR: 'us',
	CL: 'us',
	CO: 'us',
	PE: 'us',
	JP: 'us',
	KR: 'us',
	CN: 'us',
	TW: 'us',
	IN: 'us',
	PH: 'us',
	IL: 'us',
	SA: 'us',
	AE: 'us',
	IR: 'us',
	ZA: 'us',
	AU: 'us',
	NZ: 'us',
};

const WEEKEND_REGION: Record<string, number[]> = {
	AE: [5, 6],
	AF: [4, 5],
	DZ: [5, 6],
	BH: [5, 6],
	BD: [5, 6],
	EG: [5, 6],
	IQ: [5, 6],
	IL: [5, 6],
	JO: [5, 6],
	KW: [5, 6],
	LY: [5, 6],
	MV: [5, 6],
	MR: [5, 6],
	MA: [5, 6],
	OM: [5, 6],
	PK: [5, 6],
	PS: [5, 6],
	QA: [5, 6],
	SA: [5, 6],
	SD: [5, 6],
	SY: [5, 6],
	TN: [5, 6],
	YE: [5, 6],
	BN: [5, 0],
	IN: [0],
	UG: [0],
	NP: [6],
	IR: [5],
	DJ: [4, 5],
	SO: [5],
	MY: [5, 0],
};

export const EN_US_LABELS: Record<LocaleLabelKey, string> = {
	ariaTask: 'Task {0}',
	ariaMilestone: 'Milestone {0}',
	addSubtaskTitle: 'Add subtask',
	columnTaskName: 'Task name',
	columnStartDate: 'Start',
	columnEndDate: 'End',
	columnDuration: 'Duration',
	columnQuarter: 'Q',
};

function tryGetWeekInfo(code: string): {firstDay: number; weekend: number[]; minimalDays: number} | undefined {
	try {
		if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
			const locale = new Intl.Locale(code) as IntlLocaleWithWeekInfo;
			const fn = locale.getWeekInfo;
			if (typeof fn === 'function') {
				return fn.call(locale);
			}
		}
	} catch {
		// Not available — use fallback mapping table
	}
	return undefined;
}

/**
 * Derives the first day of week (0=Sun, 1=Mon, 6=Sat) from a BCP 47 code.
 * Uses `Intl.Locale.getWeekInfo()` where available (Chromium, Safari 15.4+),
 * with a CLDR-based fallback table for Firefox and older runtimes.
 *
 * @param code - A BCP 47 language tag (e.g. `'en-US'`, `'de-DE'`).
 * @returns The first day of the week: `0` (Sunday), `1` (Monday), or `6` (Saturday).
 */
export function deriveWeekStartsOn(code: string): 0 | 1 | 6 {
	const primary = code.split('-')[0]?.toLowerCase() ?? 'en';
	const region = code.split('-')[1]?.toUpperCase();

	if (region !== undefined) {
		const fromRegion = WEEK_START_REGION[region];
		if (fromRegion !== undefined) {
			return fromRegion;
		}
	}
	const fromLang = WEEK_START_LANG[primary];
	if (fromLang !== undefined) {
		return fromLang;
	}

	const info = tryGetWeekInfo(code);
	if (info !== undefined) {
		const day = info.firstDay;
		return (day === 7 ? 0 : day) as 0 | 1 | 6;
	}

	return 1;
}

/**
 * Derives the week numbering scheme from a BCP 47 code.
 * Europe and ISO-aligned regions default to `'iso'`; Americas and others to `'us'`.
 *
 * @param code - A BCP 47 language tag (e.g. `'en-US'`, `'de-DE'`).
 * @returns The week numbering scheme: `'iso'`, `'us'`, or `'simple'`.
 */
export function deriveWeekNumbering(code: string): 'iso' | 'us' | 'simple' {
	const region = code.split('-')[1]?.toUpperCase();
	if (region !== undefined) {
		const fromRegion = WEEK_NUMBERING_REGION[region];
		if (fromRegion !== undefined) {
			return fromRegion;
		}
		if (region in WEEK_START_REGION) {
			return 'us';
		}
	}

	const info = tryGetWeekInfo(code);
	if (info !== undefined) {
		if (info.minimalDays >= 4 && info.firstDay === 1) {
			return 'iso';
		}
		return 'us';
	}

	return 'iso';
}

/**
 * Derives weekend days (0=Sun … 6=Sat) from a BCP 47 code.
 * Uses `Intl.Locale.getWeekInfo()` where available, with a CLDR-based fallback table.
 *
 * @param code - A BCP 47 language tag (e.g. `'en-US'`, `'de-DE'`).
 * @returns An array of weekend day indices (sorted ascending).
 */
export function deriveWeekendDays(code: string): number[] {
	const region = code.split('-')[1]?.toUpperCase();
	if (region !== undefined) {
		const fromRegion = WEEKEND_REGION[region];
		if (fromRegion !== undefined) {
			const days = [...fromRegion];
			days.sort((a, b) => a - b);
			return days;
		}
	}

	const info = tryGetWeekInfo(code);
	if (info !== undefined) {
		const days = info.weekend.map((d: number) => (d === 7 ? 0 : d));
		days.sort((a, b) => a - b);
		return days;
	}

	return [0, 6];
}

/**
 * Resolves a {@link ChartLocale} from either a full `ChartLocale` object or a BCP 47 string.
 * When given a string, derives `weekStartsOn`, `weekNumbering`, and `weekendDays` from CLDR conventions.
 *
 * @param raw - A {@link ChartLocale} object, a BCP 47 language tag string, or `undefined`.
 * @returns A fully resolved {@link ChartLocale} with defaults applied.
 */
export function resolveChartLocale(raw: ChartLocale | string | undefined): ChartLocale {
	if (raw === undefined) {
		return {
			code: 'en',
			labels: EN_US_LABELS,
			weekStartsOn: 0,
			weekNumbering: 'iso',
			weekendDays: [0, 6],
		};
	}
	if (typeof raw !== 'string') {
		const locale: ChartLocale = {
			code: raw.code,
			weekStartsOn: raw.weekStartsOn ?? deriveWeekStartsOn(raw.code),
			weekNumbering: raw.weekNumbering ?? deriveWeekNumbering(raw.code),
			weekendDays: raw.weekendDays ?? deriveWeekendDays(raw.code),
		};
		if (raw.labels !== undefined) {
			locale.labels = raw.labels;
		}
		return locale;
	}
	const code = raw;
	return {
		code,
		weekStartsOn: deriveWeekStartsOn(code),
		weekNumbering: deriveWeekNumbering(code),
		weekendDays: deriveWeekendDays(code),
	};
}

function isoWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function usWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const dayOfYear = Math.floor((d.getTime() - yearStart.getTime()) / 86_400_000);
	const jan1Dow = yearStart.getUTCDay();
	const daysToFirstWeekStart = jan1Dow === 0 ? 0 : -jan1Dow;
	const weekStartDayOfYear = daysToFirstWeekStart;
	if (dayOfYear < weekStartDayOfYear) {
		return 0;
	}
	return Math.floor((dayOfYear - weekStartDayOfYear) / 7) + 1;
}

function simpleWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const dayOfYear = Math.floor((d.getTime() - yearStart.getTime()) / 86_400_000);
	return Math.ceil((dayOfYear + 1) / 7);
}

/**
 * Formats a week number according to the specified scheme.
 *
 * - `'iso'`: ISO 8601 (week 1 contains the first Thursday; Monday start).
 * - `'us'`: Week 1 contains January 1; Sunday start.
 * - `'simple'`: `Math.ceil(dayOfYear / 7)`.
 *
 * @param date - The date to compute the week number for.
 * @param scheme - The week numbering scheme: `'iso'`, `'us'`, or `'simple'`.
 * @returns The week number as a positive integer.
 */
export function formatWeekNumber(date: Date, scheme: 'iso' | 'us' | 'simple'): number {
	switch (scheme) {
		case 'iso': {
			return isoWeek(date);
		}
		case 'us': {
			return usWeek(date);
		}
		case 'simple': {
			return simpleWeek(date);
		}
	}
}

/**
 * Formats a label template by replacing `{0}` with the given argument.
 *
 * @param template - The template string containing `{0}` as placeholder.
 * @param arg - The value to substitute for `{0}`.
 * @returns The formatted string with the placeholder replaced.
 */
export function formatLabel(template: string, arg: string): string {
	return template.replaceAll('{0}', arg);
}
