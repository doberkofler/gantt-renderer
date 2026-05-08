export const MOBILE_BREAKPOINT = 768;
export const MOBILE_LEFT_PANE_MIN_WIDTH = 140;
export const MOBILE_LEFT_PANE_MAX_RATIO = 0.45;
export const TIMELINE_MIN_WIDTH = 220;
export const DESKTOP_MIN_RATIO = 0.25;
export const DESKTOP_MAX_RATIO = 0.4;
const MIN_PANE_WIDTH = 96;

export type ComputeLeftPaneWidthOptions = {
	hostWidth: number;
	defaultWidth: number;
	userSplitWidth: number | null;
	explicitOptWidth: number | undefined;
	responsiveSplitPane: boolean;
	mobileBreakpoint: number;
	mobileLeftPaneMinWidth: number;
	mobileLeftPaneMaxRatio: number;
	timelineMinWidth: number;
};

export function computeLeftPaneWidth(options: ComputeLeftPaneWidthOptions): number {
	const {
		hostWidth,
		defaultWidth,
		userSplitWidth,
		explicitOptWidth,
		responsiveSplitPane,
		mobileBreakpoint,
		mobileLeftPaneMinWidth,
		mobileLeftPaneMaxRatio,
		timelineMinWidth,
	} = options;

	let width = defaultWidth;

	if (hostWidth <= 0) {
		return width;
	}

	if (userSplitWidth !== null) {
		width = userSplitWidth;
	} else if (explicitOptWidth !== undefined) {
		width = explicitOptWidth;
	} else if (responsiveSplitPane && hostWidth <= mobileBreakpoint) {
		const ratioWidth = Math.floor(hostWidth * mobileLeftPaneMaxRatio);
		width = Math.min(defaultWidth, Math.max(mobileLeftPaneMinWidth, ratioWidth));
	} else {
		const minProportional = Math.floor(hostWidth * DESKTOP_MIN_RATIO);
		const maxProportional = Math.floor(hostWidth * DESKTOP_MAX_RATIO);
		width = Math.min(maxProportional, Math.max(defaultWidth, minProportional));
	}

	const maxAllowed = Math.max(MIN_PANE_WIDTH, hostWidth - timelineMinWidth);
	width = Math.min(width, maxAllowed);

	return Math.max(MIN_PANE_WIDTH, Math.floor(width));
}
