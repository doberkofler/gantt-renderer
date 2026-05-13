import {type Task as GenTask, type ZodTaskInferred as Task} from '../validation/schemas.ts';
import {GanttError} from '../errors.ts';

/**
 * A task node in the render tree, combining the flat {@link Task} input data
 * with computed hierarchy structure.
 *
 * Produced by {@link buildTaskTree}; consumed by virtualized row rendering
 * and the timeline layout engine.
 */
export type TaskNode = GenTask<Record<string, unknown>> & {
	/** Array of child task nodes in the tree hierarchy. */
	children: TaskNode[];
	/** 0 = root */
	depth: number;
};

function detectParentCycles(tasks: Task[]): void {
	const adj = new Map<number, number[]>();
	for (const task of tasks) {
		adj.set(task.id, []);
		if (task.parent !== undefined) {
			const parents = adj.get(task.parent);
			if (parents !== undefined) {
				parents.push(task.id);
			}
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
				throw new GanttError('PARENT_CYCLE', `Parent cycle detected: ${[...path].reverse().join(' -> ')}`);
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
 * Builds a typed tree from a flat task array.
 * Order of tasks[] is irrelevant — parents need not precede children.
 *
 * @param tasks - The flat array of tasks to convert into a tree.
 * @returns Root-level {@link TaskNode} instances with populated `children`.
 * @throws {GanttError} When a task references a `parent` id that does not exist,
 *         when a parent cycle is detected, or when a `parent` points to a
 *         milestone or leaf task.
 */
export function buildTaskTree(tasks: Task[]): TaskNode[] {
	const map = new Map<number, TaskNode>();
	const roots: TaskNode[] = [];

	// Pass 0: validate — no parent may point to a milestone or leaf
	for (const task of tasks) {
		if (task.parent !== undefined) {
			const parentTask = tasks.find((t) => t.id === task.parent);
			if (parentTask !== undefined && (parentTask.kind === 'milestone' || parentTask.kind === 'task')) {
				throw new GanttError('PARENT_REFERENCE', `Task id=${task.id} cannot have parent id=${task.parent} of kind '${parentTask.kind}'`);
			}
		}
	}

	// Pass 1: allocate nodes
	for (const task of tasks) {
		map.set(task.id, {...task, children: [], depth: 0});
	}

	// Pass 2: detect parent cycles via DFS before wiring edges
	detectParentCycles(tasks);

	// Pass 3: wire parent→child edges
	for (const task of tasks) {
		const node = map.get(task.id);
		if (node === undefined) {
			continue;
		} // unreachable
		if (task.parent !== undefined) {
			const parent = map.get(task.parent);
			if (parent === undefined) {
				throw new GanttError('PARENT_REFERENCE', `Task id=${task.id} references non-existent parent id=${task.parent}`);
			}
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	// Pass 4: compute depths via DFS from roots
	(function setDepths(nodes: TaskNode[], d: number): void {
		for (const n of nodes) {
			n.depth = d;
			setDepths(n.children, d + 1);
		}
	})(roots, 0);

	return roots;
}

/**
 * Flattens a tree into a visible row list.
 * A node's children are included only when its id is in `expandedIds`.
 *
 * @param roots - The root-level {@link TaskNode} instances of the tree.
 * @param expandedIds - Set of task IDs whose children should be rendered.
 * @returns A depth-first flattened array of visible {@link TaskNode} items.
 */
export function flattenTree(roots: TaskNode[], expandedIds: ReadonlySet<number>): TaskNode[] {
	const rows: TaskNode[] = [];
	function walk(node: TaskNode): void {
		rows.push(node);
		if (node.children.length > 0 && expandedIds.has(node.id)) {
			for (const child of node.children) {
				walk(child);
			}
		}
	}
	for (const root of roots) {
		walk(root);
	}
	return rows;
}

/**
 * Returns `true` when a node has children in the tree.
 *
 * @param node - The {@link TaskNode} to inspect.
 * @returns `true` if `node.children.length > 0`.
 */
export function isParent(node: TaskNode): boolean {
	return node.children.length > 0;
}
