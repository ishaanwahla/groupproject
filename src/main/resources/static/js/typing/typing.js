import { appState as app, inputState as input, bufferState } from './state.js';
import { cycleChunk, populateBuffer, loadSelectedBook, renderChunks } from './buffer.js';
import { statsConstants as stat, uiConstants as ui, bufferConstants as buf } from './constants.js';
import { showSessionOverlay, beginSessionSelect } from './session.js';
import { updateBookProgress, updateStats } from './progress.js';


// Check if stat tracking needs to be enabled
function ensureStatTracking() {
	if (!app.trackingStats) {
		app.trackingStats = true;
		app.startTime = Date.now();
		app.intervalId = setInterval(updateStats, stat.STAT_UPDATE_INTERVAL);
	}
}

// Pause typing, bring up an overlay and stop WPM/Accuracy and the Timer from changing
export function togglePause() {
	if (!app.sessionActive) return; // wait until the user chooses a session

	const pauseIndicator = document.getElementById("pause-indicator");
	const pauseInstructions = document.getElementById("pause-instructions");
	const typingInterface = document.getElementById("typing-interface");

	if (!app.isPaused) { // Pause
		app.isPaused = true;
		typingInterface.style.opacity = `${ui.PAUSED_OPACITY}`;
		// this class will pause the cursor blinking animation
		typingInterface.classList.add("interface-paused");
		pauseInstructions.style.display = "none";
		if (pauseIndicator) pauseIndicator.style.display = "block";
	} else { // Resume
		if (app.bufferError) return; // refuse to unpause while in error state

		app.isPaused = false;
		typingInterface.style.opacity = "1.0";
		// start the cursor flashing again
		typingInterface.classList.remove("interface-paused");
		pauseInstructions.style.display = "block";
		if (pauseIndicator) pauseIndicator.style.display = "none";
	}
}

// Scroll the typing Interface to the cursor's current location
export function scrollToCursor() {
	const typingInterface = document.getElementById("typing-interface");
	const currentSpan = app.spanElements[input.currentSpanPosition];

	if (typingInterface && currentSpan) {
		typingInterface.scrollTop = currentSpan.offsetTop - ui.LINE_HEIGHT;
	} else if (typingInterface) {
		// fallback in case its a fresh session
		typingInterface.scrollTop = 0;
	}
}

// Scrolls the typing interface down if required
//
// Params: span is the Span DOM element corresponding to the most recent character typed
function handleScroll(span) {
	const nextSpan = app.spanElements[input.currentSpanPosition + 1];
	if (nextSpan && nextSpan.offsetTop > span.offsetTop) {
		// scrolls the screen down slightly
		const typingInterface = document.getElementById("typing-interface");
		typingInterface.scrollTop = nextSpan.offsetTop - ui.LINE_HEIGHT;
	}
	if (nextSpan) nextSpan.classList.add("cursor");
}

// Dynamic colour generation for incorrect characters moving from yellow down to red
// 
// Returns: a String representing a CSS RGB colour
function getMistakeColour() {
	// decrease green each time until it hits 0
	const green = Math.max(0, ui.MAX_GREEN - (input.currentTypingAttempt * ui.MISTAKE_STEP));
	return `rgb(255, ${green}, 0)`;
}

// Play an animation and add iterative styling to a character based on how many incorrect attempts have been made
//
// Params: span is the Span DOM element corresponding to the incorrectly typed character
function handleTypo(span) {
	// space needs the entire background changed or the user won't see any visual indicator
	const isSpace = span.textContent === " " || span.textContent === "\u00A0";

	let mistakeColour = getMistakeColour();

	isSpace ? span.style.backgroundColor = mistakeColour : span.style.color = mistakeColour;

	// play the 'wobble' animation on the character
	span.animate(
		[
			{ transform: 'translateX(0px)' },
			{ transform: `translateX(-${ui.WOBBLE_AMT}px)` },
			{ transform: `translateX(${ui.WOBBLE_AMT}px)` },
			{ transform: `translateX(-${ui.HALF_WOBBLE_AMT}px)` },
			{ transform: `translateX(${ui.HALF_WOBBLE_AMT}px)` },
			{ transform: 'translateX(0px)' }
		],
		{
			duration: ui.WOBBLE_DURATION,
			iterations: 1
		}
	);
}

// Checks the keyboard input to determine the correct course of action
// depending on whether the input matches the expected input
//
// Params: pressedKey the e.key property captured from the keydown event listener 
// span the Span DOM element corresponding to the current key to be typed
function handleCharacterInput(pressedKey, span) {
	const targetUnit = app.visibleChunks[0].text[0];

	const expectedKey = targetUnit.keys[input.currentUnitProgress];
	const isCorrect = (pressedKey === expectedKey) & 1;
	if (isCorrect) {
		input.currentTypingAttempt = 0;

		app.sessionCorrectKeystrokes++;
		app.sessionKeystrokes++;

		const isFinalKey = input.currentUnitProgress === targetUnit.keys.length - 1;

		if (!isFinalKey) {
			// more keys required before this unit is complete —
			// don't advance the position, don't touch the span yet
			input.currentUnitProgress++;
			return;
		}

		// remove the character now that we're done with it
		input.currentUnitProgress = 0;
		app.visibleChunks[0].text.shift();

		span.classList.remove("cursor");
		span.classList.add("correct")
		if (targetUnit.display === " ") app.currentTypedWordIndex++;

		handleScroll(span);

		input.currentSpanPosition++;
		updateBookProgress(app.currentTypedWordIndex);
	} else {
		app.sessionKeystrokes++;
		input.currentTypingAttempt++;
		handleTypo(span);
	};
}

// Setup function that runs once after the DOM finishes initializing
async function setup() {
	showSessionOverlay();
	const loaded = await loadSelectedBook();
	if (loaded === null) {
		showSessionOverlay("Unable to load your book right now. Please check your connection and try again.");
		return;
	}
	if (!loaded) {
		showSessionOverlay("Add a book to begin");
		return;
	}

	await populateBuffer();

	// grab chunks to populate the screen with text
	while (app.visibleChunks.length < buf.MAX_VISIBILE_CHUNKS && bufferState.textBuffer.length > 0) {
		app.visibleChunks.push(bufferState.textBuffer.shift());
	}

	renderChunks();
	populateBuffer();

	beginSessionSelect();
}

window.addEventListener("keydown", (e) => {
	// pauses the typing test
	if (document.getElementById("errorDialog").open) return;
	if (e.key === "Escape") {
		togglePause();
		return;
	}
	if (!app.sessionActive) return; // wait until the user chooses a session

	// should ignore non-standard keys (shift, alt)
	// and stop the page from scrolling with space
	if (e.key.length !== 1 || app.isPaused) return;
	e.preventDefault();

	if (app.visibleChunks.length === 0) return;

	ensureStatTracking();

	const currentSpan = app.spanElements[input.currentSpanPosition];

	// if we run past the available spans somehow, return to avoid a crash
	if (!currentSpan) return;

	handleCharacterInput(e.key, currentSpan);

	if (app.visibleChunks[0].text.length === 0) {
		cycleChunk();
	}
});

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
