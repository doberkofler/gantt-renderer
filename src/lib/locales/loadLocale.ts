import {type ChartLocale} from '../locale.ts';

type LocaleImport = {CHART_LOCALE: ChartLocale};

const _importMap: Record<string, () => Promise<LocaleImport>> = {
	en: async () => {
		const mod = await import('./en.ts');
		return mod;
	},
	'zh-Hans': async () => {
		const mod = await import('./zh-Hans.ts');
		return mod;
	},
	'zh-Hant': async () => {
		const mod = await import('./zh-Hant.ts');
		return mod;
	},
	es: async () => {
		const mod = await import('./es.ts');
		return mod;
	},
	'pt-BR': async () => {
		const mod = await import('./pt-BR.ts');
		return mod;
	},
	'pt-PT': async () => {
		const mod = await import('./pt-PT.ts');
		return mod;
	},
	fr: async () => {
		const mod = await import('./fr.ts');
		return mod;
	},
	de: async () => {
		const mod = await import('./de.ts');
		return mod;
	},
	ru: async () => {
		const mod = await import('./ru.ts');
		return mod;
	},
	ja: async () => {
		const mod = await import('./ja.ts');
		return mod;
	},
	ko: async () => {
		const mod = await import('./ko.ts');
		return mod;
	},
	ar: async () => {
		const mod = await import('./ar.ts');
		return mod;
	},
	hi: async () => {
		const mod = await import('./hi.ts');
		return mod;
	},
	id: async () => {
		const mod = await import('./id.ts');
		return mod;
	},
	th: async () => {
		const mod = await import('./th.ts');
		return mod;
	},
	tr: async () => {
		const mod = await import('./tr.ts');
		return mod;
	},
	it: async () => {
		const mod = await import('./it.ts');
		return mod;
	},
	pl: async () => {
		const mod = await import('./pl.ts');
		return mod;
	},
	nl: async () => {
		const mod = await import('./nl.ts');
		return mod;
	},
	sv: async () => {
		const mod = await import('./sv.ts');
		return mod;
	},
	da: async () => {
		const mod = await import('./da.ts');
		return mod;
	},
	nb: async () => {
		const mod = await import('./nb.ts');
		return mod;
	},
	fi: async () => {
		const mod = await import('./fi.ts');
		return mod;
	},
	uk: async () => {
		const mod = await import('./uk.ts');
		return mod;
	},
	ro: async () => {
		const mod = await import('./ro.ts');
		return mod;
	},
	cs: async () => {
		const mod = await import('./cs.ts');
		return mod;
	},
	hu: async () => {
		const mod = await import('./hu.ts');
		return mod;
	},
	el: async () => {
		const mod = await import('./el.ts');
		return mod;
	},
	sk: async () => {
		const mod = await import('./sk.ts');
		return mod;
	},
	bg: async () => {
		const mod = await import('./bg.ts');
		return mod;
	},
	hr: async () => {
		const mod = await import('./hr.ts');
		return mod;
	},
	sr: async () => {
		const mod = await import('./sr.ts');
		return mod;
	},
	lt: async () => {
		const mod = await import('./lt.ts');
		return mod;
	},
	lv: async () => {
		const mod = await import('./lv.ts');
		return mod;
	},
	et: async () => {
		const mod = await import('./et.ts');
		return mod;
	},
	sl: async () => {
		const mod = await import('./sl.ts');
		return mod;
	},
	be: async () => {
		const mod = await import('./be.ts');
		return mod;
	},
	sq: async () => {
		const mod = await import('./sq.ts');
		return mod;
	},
	mk: async () => {
		const mod = await import('./mk.ts');
		return mod;
	},
	ca: async () => {
		const mod = await import('./ca.ts');
		return mod;
	},
	eu: async () => {
		const mod = await import('./eu.ts');
		return mod;
	},
	cy: async () => {
		const mod = await import('./cy.ts');
		return mod;
	},
	ga: async () => {
		const mod = await import('./ga.ts');
		return mod;
	},
	mt: async () => {
		const mod = await import('./mt.ts');
		return mod;
	},
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
