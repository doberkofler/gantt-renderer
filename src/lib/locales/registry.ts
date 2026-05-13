import {type ChartLocale} from '../locale.ts';

const _registry = new Map<string, ChartLocale>();

export function registerLocale(locale: ChartLocale): void {
	_registry.set(locale.code, locale);
}

export function getRegisteredLocale(code: string): ChartLocale | undefined {
	return _registry.get(code);
}

export function getRegisteredLocales(): ChartLocale[] {
	return [..._registry.values()];
}
