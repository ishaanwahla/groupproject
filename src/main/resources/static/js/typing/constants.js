// constants.js
// immutable data used across the application
//
// Note: Object.freeze ensures none of this data can be altered

export const bufferConstants = {
	TARGET_BUFFER_SIZE: 5,
	MAX_VISIBILE_CHUNKS: 4,
	RETAINED_LINES: 2,
	CHARS_PER_LINE: 88,
};
Object.freeze(bufferConstants);

// used in 'progress.js'
export const statsConstants = {
	MAX_ACCURACY: 100,
	MS_PER_MINUTE: 60000,
	CHARS_PER_WORD: 5,
	STAT_UPDATE_INTERVAL: 1000,
	STAT_SAVE_INTERVAL: 5000,
};
Object.freeze(statsConstants);

// used in 'session.js'
export const sessionConstants = {
	SECONDS_PER_MIN: 60,
	MAX_CUSTOM_MINUTES: 300,
	RADIX: 10,
	LABEL_PADDING: 2,
};
Object.freeze(sessionConstants);

export const uiConstants = {
	WOBBLE_AMT: 4,
	HALF_WOBBLE_AMT: 2,
	WOBBLE_DURATION: 150,
	MAX_GREEN: 255,
	MISTAKE_STEP: 64,
	LINE_HEIGHT: 40,
	PAUSED_OPACITY: 0.3,
	RAMP_SAMPLE: 100,

	ERROR_COLOR_STOPS: [
		{ rate: 0.00, rgb: null },
		{ rate: 0.01, rgb: [250, 204, 21] },    // yellow
		{ rate: 0.02, rgb: [251, 146, 60] },    // orange
		{ rate: 0.03, rgb: [239, 68, 68] },     // orangey-red
		{ rate: 0.04, rgb: [220, 38, 38] },     // red
		{ rate: 0.05, rgb: [153, 27, 27] },     // deep red
	],
};
Object.freeze(uiConstants);

