// state.js
// manages global state across the application
// replaces global variables strewn about
//
// Note: Object.seal explicitly prevents new properties from being created
// or existing properties from being deleted

// global application state
// shared across multiple files
export const appState = {
	bufferError: false, // prevents the test from proceeding until the buffer fills again
	visibleChunks: [], // raw text representation of what the user currently sees
	selectedCollectionBook: null,
	spanElements: [], // holds span elements for individual characters displayed in DOM 
	currentTypedWordIndex: 0,
	trackingStats: false,
	startTime: null,
	intervalId: null,
	sessionKeystrokes: 0,
	sessionCorrectKeystrokes: 0,
	isPaused: false,
	sessionActive: false,
	isEndlessMode: false,
	remainingSeconds: 0,
};
Object.seal(appState);

// owned by `buffer.js`
// used to split raw text up and track position within the book
export const bufferState = {
	textBuffer: [], // an array of objects representing the fetched text
	currentChunkId: 0,
	reachedEndOfBook: false,
};
Object.seal(bufferState);

// owned by `typing.js`
// tracks the input position as the user types
export const inputState = {
	currentSpanPosition: 0,
	currentUnitProgress: 0, //how many keys of the current unit have been matched
	currentTypingAttempt: 0, //how many times the user has tried to type the current unit
};
Object.seal(inputState);
