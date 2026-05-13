import {type ChartLocale} from '../locale.ts';

type LocaleImport = {CHART_LOCALE: ChartLocale};

const _importMap: Record<string, () => Promise<LocaleImport>> = {
	en: async () => (await import('./en.ts')) as unknown as LocaleImport,
	'zh-Hans': async () => (await import('./zh-Hans.ts')) as unknown as LocaleImport,
	'zh-Hant': async () => (await import('./zh-Hant.ts')) as unknown as LocaleImport,
	es: async () => (await import('./es.ts')) as unknown as LocaleImport,
	'pt-BR': async () => (await import('./pt-BR.ts')) as unknown as LocaleImport,
	'pt-PT': async () => (await import('./pt-PT.ts')) as unknown as LocaleImport,
	fr: async () => (await import('./fr.ts')) as unknown as LocaleImport,
	de: async () => (await import('./de.ts')) as unknown as LocaleImport,
	ru: async () => (await import('./ru.ts')) as unknown as LocaleImport,
	ja: async () => (await import('./ja.ts')) as unknown as LocaleImport,
	ko: async () => (await import('./ko.ts')) as unknown as LocaleImport,
	ar: async () => (await import('./ar.ts')) as unknown as LocaleImport,
	hi: async () => (await import('./hi.ts')) as unknown as LocaleImport,
	id: async () => (await import('./id.ts')) as unknown as LocaleImport,
	th: async () => (await import('./th.ts')) as unknown as LocaleImport,
	tr: async () => (await import('./tr.ts')) as unknown as LocaleImport,
	it: async () => (await import('./it.ts')) as unknown as LocaleImport,
	pl: async () => (await import('./pl.ts')) as unknown as LocaleImport,
	nl: async () => (await import('./nl.ts')) as unknown as LocaleImport,
	sv: async () => (await import('./sv.ts')) as unknown as LocaleImport,
	da: async () => (await import('./da.ts')) as unknown as LocaleImport,
	nb: async () => (await import('./nb.ts')) as unknown as LocaleImport,
	fi: async () => (await import('./fi.ts')) as unknown as LocaleImport,
	uk: async () => (await import('./uk.ts')) as unknown as LocaleImport,
	ro: async () => (await import('./ro.ts')) as unknown as LocaleImport,
	cs: async () => (await import('./cs.ts')) as unknown as LocaleImport,
	hu: async () => (await import('./hu.ts')) as unknown as LocaleImport,
	el: async () => (await import('./el.ts')) as unknown as LocaleImport,
	sk: async () => (await import('./sk.ts')) as unknown as LocaleImport,
	bg: async () => (await import('./bg.ts')) as unknown as LocaleImport,
	hr: async () => (await import('./hr.ts')) as unknown as LocaleImport,
	sr: async () => (await import('./sr.ts')) as unknown as LocaleImport,
	lt: async () => (await import('./lt.ts')) as unknown as LocaleImport,
	lv: async () => (await import('./lv.ts')) as unknown as LocaleImport,
	et: async () => (await import('./et.ts')) as unknown as LocaleImport,
	sl: async () => (await import('./sl.ts')) as unknown as LocaleImport,
	be: async () => (await import('./be.ts')) as unknown as LocaleImport,
	sq: async () => (await import('./sq.ts')) as unknown as LocaleImport,
	mk: async () => (await import('./mk.ts')) as unknown as LocaleImport,
	ca: async () => (await import('./ca.ts')) as unknown as LocaleImport,
	eu: async () => (await import('./eu.ts')) as unknown as LocaleImport,
	cy: async () => (await import('./cy.ts')) as unknown as LocaleImport,
	ga: async () => (await import('./ga.ts')) as unknown as LocaleImport,
	mt: async () => (await import('./mt.ts')) as unknown as LocaleImport,
};

export const SUPPORTED_LOCALE_CODES = Object.keys(_importMap);

export async function loadLocale(code: string): Promise<ChartLocale> {
	const loader = _importMap[code];
	if (loader === undefined) {
		throw new Error(`Unsupported locale: ${code}`);
	}
	const mod = await loader();
	return mod.CHART_LOCALE;
}
