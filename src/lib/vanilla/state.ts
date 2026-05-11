import {type _GanttInputZod as GanttInput} from '../validation/schemas.ts';
import {type TimeScale} from '../timeline/scale.ts';
import {type TaskNode} from '../domain/tree.ts';
import {type BarLayout} from '../timeline/layoutEngine.ts';
import {type RoutedLink} from '../rendering/linkRouter.ts';
import {type PixelMapper} from '../timeline/pixelMapper.ts';
import {type ChartLocale} from '../locale.ts';

export type ResolvedSpecialDay = {
	kind: 'holiday' | 'custom';
	label?: string;
	className?: string;
};

/**
 * All derived render state computed once per update cycle.
 * Passed read-only into every DOM renderer.
 */
export type GanttState = {
	input: GanttInput;
	scale: TimeScale;
	highlightLinkedDependenciesOnSelect: boolean;
	linkCreationEnabled: boolean;
	progressDragEnabled: boolean;
	expandedIds: Set<number>;
	selectedId: number | null;
	scrollTop: number;
	/** Derived from input + expandedIds */
	allRows: TaskNode[];
	/** Derived from allRows + scale */
	mapper: PixelMapper;
	viewportStart: Date;
	viewportEnd: Date;
	totalWidth: number;
	layouts: Map<number, BarLayout>;
	links: RoutedLink[];
	/** Virtual slice */
	startIndex: number;
	endIndex: number;
	paddingTop: number;
	paddingBottom: number;
	showWeekends: boolean;
	weekendDays: Set<number>;
	specialDaysByDate: Map<string, ResolvedSpecialDay>;
	locale: ChartLocale;
};
