import {type Link, type Task} from '../validation/schemas.ts';
import {GanttError} from '../errors.ts';

/**
 * Detects circular dependencies in the link graph using DFS tri-colour marking.
 *
 * @param tasks - The task list (used to build the vertex set).
 * @param links - The dependency links defining the directed edges.
 * @throws {GanttError} When a cycle is detected, with a human-readable cycle path.
 */
export function detectCycles(tasks: Task[], links: Link[]): void {
	// Build adjacency list (directed: source → target)
	const adj = new Map<number, number[]>();
	for (const task of tasks) {
		adj.set(task.id, []);
	}
	for (const link of links) {
		const neighbors = adj.get(link.source);
		if (neighbors !== undefined) {
			neighbors.push(link.target);
		}
	}

	const WHITE = 0,
		GRAY = 1,
		BLACK = 2;
	const color = new Map<number, 0 | 1 | 2>();
	const parent = new Map<number, number>();

	for (const id of adj.keys()) {
		color.set(id, WHITE);
	}

	const dfs = (u: number): void => {
		color.set(u, GRAY);
		for (const v of adj.get(u) ?? []) {
			const vc = color.get(v) ?? WHITE;
			if (vc === GRAY) {
				// Back-edge found — reconstruct cycle
				const path: number[] = [v, u];
				let cur = u;
				while (cur !== v) {
					const p = parent.get(cur);
					if (p === undefined) {
						break;
					}
					path.push(p);
					cur = p;
				}
				throw new GanttError('DEPENDENCY_CYCLE', `Circular dependency detected: ${[...path].reverse().join(' -> ')}`);
			}
			if (vc === WHITE) {
				parent.set(v, u);
				dfs(v);
			}
		}
		color.set(u, BLACK);
	};

	for (const id of adj.keys()) {
		if ((color.get(id) ?? WHITE) === WHITE) {
			dfs(id);
		}
	}
}

/**
 * Validates that every link references existing task IDs.
 *
 * @param tasks - The task list (used as the reference set of valid IDs).
 * @param links - The dependency links to validate.
 * @throws {GanttError} When any link references a non-existent source or target task.
 */
export function validateLinkRefs(tasks: Task[], links: Link[]): void {
	const ids = new Set(tasks.map((t) => t.id));
	for (const link of links) {
		if (!ids.has(link.source)) {
			throw new GanttError('LINK_REFERENCE', `Link id=${link.id}: source=${link.source} not found`);
		}
		if (!ids.has(link.target)) {
			throw new GanttError('LINK_REFERENCE', `Link id=${link.id}: target=${link.target} not found`);
		}
	}
}
