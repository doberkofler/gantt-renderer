import {SpecialDaySchema, type _GanttInputZod as GanttInput, type SpecialDay} from '../validation/schemas.ts';
import {parseDate} from '../domain/dateMath.ts';
import {buildTaskTree} from '../domain/tree.ts';
import {type ResolvedSpecialDay} from './state.ts';

export function buildTaskIndex(tasks: GanttInput['tasks']): Map<number, number> {
	const index = new Map<number, number>();
	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i];
		if (task !== undefined) {
			index.set(task.id, i);
		}
	}
	return index;
}

export function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function buildSpecialDayIndex(specialDays: SpecialDay[]): Map<string, ResolvedSpecialDay> {
	const map = new Map<string, ResolvedSpecialDay>();
	for (const specialDay of specialDays) {
		const parsed = SpecialDaySchema.parse(specialDay);
		const isoDate = toIsoDate(parseDate(parsed.date));
		map.set(isoDate, {
			kind: parsed.kind,
			...(parsed.label === undefined ? {} : {label: parsed.label}),
			...(parsed.className === undefined ? {} : {className: parsed.className}),
		});
	}
	return map;
}

export function normalizeWeekendDays(days: number[] | undefined): Set<number> {
	if (days === undefined) {
		return new Set([0, 6]);
	}

	const normalized = new Set<number>();
	for (const day of days) {
		if (!Number.isInteger(day) || day < 0 || day > 6) {
			throw new Error('weekendDays must contain integers in range 0..6');
		}
		normalized.add(day);
	}
	return normalized;
}

export function getExpandableTaskIds(tasks: GanttInput['tasks']): Set<number> {
	const roots = buildTaskTree(tasks);
	const expandableIds = new Set<number>();
	const stack = [...roots];
	while (stack.length > 0) {
		const node = stack.pop();
		if (node === undefined) {
			continue;
		}
		if (node.children.length > 0) {
			expandableIds.add(node.id);
		}
		for (const child of node.children) {
			stack.push(child);
		}
	}
	return expandableIds;
}

export function getInitialExpandedIds(tasks: GanttInput['tasks']): Set<number> {
	const expandableIds = getExpandableTaskIds(tasks);
	const expandedIds = new Set<number>();
	for (const task of tasks) {
		if (task.kind === 'project' && task.open && expandableIds.has(task.id)) {
			expandedIds.add(task.id);
		}
	}
	return expandedIds;
}
