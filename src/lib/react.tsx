import {forwardRef, useEffect, useRef, type ForwardedRef, type ReactElement} from 'react';

import {type GanttInputRaw} from './validation/schemas.ts';
import {GanttChart as NativeGanttChart, type GanttCallbacks, type GanttInstance, type GanttOptions} from './vanilla/gantt-chart.ts';

/** Props for the React adapter backed by the native Gantt chart. */
export type GanttChartReactProps<TTaskData = never, TLinkData = never> = {
	/** The complete chart dataset. A new object identity updates the native chart. */
	readonly input: GanttInputRaw<TTaskData, TLinkData>;
	/** Native chart options. Removing an option recreates the native chart to restore its default. */
	readonly options?: GanttOptions;
	/** Native chart interaction callbacks. */
	readonly callbacks?: GanttCallbacks<TTaskData, TLinkData>;
	/** Class added to the adapter-owned host element. */
	readonly className?: string;
};

function setForwardedRef<TTaskData, TLinkData>(
	ref: ForwardedRef<GanttInstance<TTaskData, TLinkData>>,
	value: GanttInstance<TTaskData, TLinkData> | null,
): void {
	if (typeof ref === 'function') {
		ref(value);
		return;
	}
	if (ref !== null) {
		ref.current = value;
	}
}

function createNativeInstance<TTaskData, TLinkData>(
	host: HTMLDivElement,
	input: GanttInputRaw<TTaskData, TLinkData>,
	options: GanttOptions | undefined,
	callbacks: GanttCallbacks<TTaskData, TLinkData> | undefined,
): GanttInstance<TTaskData, TLinkData> {
	const instance = new NativeGanttChart<TTaskData, TLinkData>(host, options === undefined ? {} : {...options});
	try {
		instance.setCallbacks(callbacks === undefined ? {} : {...callbacks});
		instance.update(input);
		return instance;
	} catch (error: unknown) {
		instance.destroy();
		throw error;
	}
}

function hasRemovedOption(previous: GanttOptions | undefined, next: GanttOptions | undefined): boolean {
	if (previous === undefined) {
		return false;
	}
	const nextOptions = next ?? {};
	return Object.keys(previous).some((key) => !(key in nextOptions));
}

function GanttChartComponent<TTaskData, TLinkData>(
	props: GanttChartReactProps<TTaskData, TLinkData>,
	ref: ForwardedRef<GanttInstance<TTaskData, TLinkData>>,
): ReactElement {
	const {input, options, callbacks, className} = props;
	const hostRef = useRef<HTMLDivElement | null>(null);
	const instanceRef = useRef<GanttInstance<TTaskData, TLinkData> | null>(null);
	const inputRef = useRef(input);
	const optionsRef = useRef(options);
	const callbacksRef = useRef(callbacks);
	const refRef = useRef(ref);
	const lastInputRef = useRef(input);
	const lastOptionsRef = useRef(options);
	const lastCallbacksRef = useRef(callbacks);

	useEffect(() => {
		inputRef.current = input;
		optionsRef.current = options;
		callbacksRef.current = callbacks;
		refRef.current = ref;
	});

	useEffect(() => {
		const host = hostRef.current;
		if (host === null) {
			return;
		}
		const instance = createNativeInstance(host, inputRef.current, optionsRef.current, callbacksRef.current);
		instanceRef.current = instance;
		setForwardedRef(refRef.current, instance);

		return (): void => {
			const currentInstance = instanceRef.current;
			instanceRef.current = null;
			setForwardedRef(refRef.current, null);
			currentInstance?.destroy();
		};
	}, []);

	useEffect(() => {
		setForwardedRef(ref, instanceRef.current);
		return (): void => {
			setForwardedRef(ref, null);
		};
	}, [ref]);

	useEffect(() => {
		if (lastOptionsRef.current === options) {
			return;
		}
		const instance = instanceRef.current;
		const host = hostRef.current;
		if (instance === null || host === null) {
			return;
		}

		if (hasRemovedOption(lastOptionsRef.current, options)) {
			instanceRef.current = null;
			setForwardedRef(refRef.current, null);
			instance.destroy();
			const replacement = createNativeInstance(host, inputRef.current, options, callbacksRef.current);
			instanceRef.current = replacement;
			setForwardedRef(refRef.current, replacement);
			lastInputRef.current = inputRef.current;
			lastCallbacksRef.current = callbacksRef.current;
		} else {
			instance.setOptions(options === undefined ? {} : {...options});
		}
		lastOptionsRef.current = options;
	}, [options]);

	useEffect(() => {
		if (lastCallbacksRef.current !== callbacks) {
			instanceRef.current?.setCallbacks(callbacks === undefined ? {} : {...callbacks});
			lastCallbacksRef.current = callbacks;
		}
	}, [callbacks]);

	useEffect(() => {
		if (lastInputRef.current !== input) {
			instanceRef.current?.update(input);
			lastInputRef.current = input;
		}
	}, [input]);

	return <div ref={hostRef} className={['gantt-react', className].filter(Boolean).join(' ')} />;
}

/** React adapter backed by the native Gantt chart. */
export const GanttChart = forwardRef(GanttChartComponent) as <TTaskData = never, TLinkData = never>(
	props: GanttChartReactProps<TTaskData, TLinkData> & {
		readonly ref?: ForwardedRef<GanttInstance<TTaskData, TLinkData>>;
	},
) => ReactElement;
