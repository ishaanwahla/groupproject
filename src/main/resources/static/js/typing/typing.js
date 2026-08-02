import { appState as app, inputState as input, bufferState } from './state.js';
import { cycleChunk, populateBuffer, loadSelectedBook, renderChunks } from './buffer.js';
import { statsConstants as stat, uiConstants as ui, bufferConstants as buf } from './constants.js';
import { showSessionOverlay, beginSessionSelect, setupEndSessionControls } from './session.js';
import { loadUserStats, updateBookProgress, updateStats } from './progress.js';
import { createVirtualKeyboard, setupKeys, populateCharLookup, updateKeyHint, KEYS, CHAR_TO_CODE } from './keyboard.js';



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
		if (pauseIndicator) pauseIndicator.style.display = "flex";
	} else { // Resume
		if (app.bufferError) return; // refuse to unpause while in error state

		app.isPaused = false;
		typingInterface.style.opacity = "1.0";
		// start the cursor flashing again
		typingInterface.classList.remove("interface-paused");
		pauseInstructions.style.display = "flex";
		if (pauseIndicator) pauseIndicator.style.display = "none";
	}
}

// Scroll the typing Interface to the cursor's current location
export function scrollToCursor() {
	const typingInterface = document.getElementById("typing-interface");
	const currentSpan = app.spanElements[input.currentSpanPosition];

	if (typingInterface && currentSpan) {
		typingInterface.scrollTo({
			top: currentSpan.offsetTop - ui.LINE_HEIGHT,
			behavior: "instant",
		});
	} else if (typingInterface) {
		typingInterface.scrollTo({ top: 0, behavior: "instant" });
	}
}

// Calculate a colour for the key based on the accuracy rating
//
// Params: rate - a percentage float representing the accuracy rating of the current key
// Returns: a string representing the colour to style the key
function getErrorTintColor(rate) {
	if (rate < ui.ERROR_COLOR_STOPS[1].rate) return "transparent";

	const stops = ui.ERROR_COLOR_STOPS;
	const last = stops[stops.length - 1];
	if (rate >= last.rate) {
		const [r, g, b] = last.rgb;
		return `rgba(${r}, ${g}, ${b}, 0.55)`;
	}

	for (let i = 1; i < stops.length - 1; i++) {
		const a = stops[i], b = stops[i + 1];
		if (rate >= a.rate && rate <= b.rate) {
			// takes an average between the current colour stop
			// and the next, in order to smoothly transition between them
			const t = (rate - a.rate) / (b.rate - a.rate);
			const [r1, g1, b1] = a.rgb;
			const [r2, g2, b2] = b.rgb;
			const r = Math.round(r1 + (r2 - r1) * t);
			const g = Math.round(g1 + (g2 - g1) * t);
			const bch = Math.round(b1 + (b2 - b1) * t);
			return `rgba(${r}, ${g}, ${bch}, 0.55)`;
		}
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
// Params: event the e property captured from the keydown event listener 
// span the Span DOM element corresponding to the current key to be typed
function handleCharacterInput(event, span) {
	const targetUnit = app.visibleChunks[0].text[0];

	const expectedKey = targetUnit.keys[input.currentUnitProgress];
	const isCorrect = (event.key === expectedKey) & 1;
	recordKeyAttempt(expectedKey, isCorrect);
	if (isCorrect) {
		input.currentTypingAttempt = 0;

		app.sessionCorrectKeystrokes++;
		app.sessionKeystrokes++;

		const isFinalKey = input.currentUnitProgress === targetUnit.keys.length - 1;

		if (!isFinalKey) {
			// more keys required before this unit is complete —
			// don't advance the position, don't touch the span yet
			input.currentUnitProgress++;
			updateKeyHint();
			return;
		}

		// remove the character now that we're done with it
		input.currentUnitProgress = 0;
		app.visibleChunks[0].text.shift();

		span.classList.remove("cursor");
		span.classList.add("correct")
		if (targetUnit.display === " ") {
			app.currentTypedWordIndex++;
			app.sessionWordsTyped++;
		}

		handleScroll(span);

		input.currentSpanPosition++;
		updateBookProgress(app.currentTypedWordIndex);
		updateKeyHint();
	} else {
		const keyElement = KEYS.get(event.code).dom.keyElement;
		if (keyElement) {
			keyElement.classList.add("pressed", "typo");
		}
		app.sessionKeystrokes++;
		input.currentTypingAttempt++;
		app.mistakeCounts[expectedKey] = (app.mistakeCounts[expectedKey] || 0) + 1;
		handleTypo(span);
	};
}


// Keep track of the accuracy rating for the current letter being typed
//
// Params: expectedChar - raw character string of the current character being typed
//		   isCorrect - boolean representing whether the current attempt was a typo or not
function recordKeyAttempt(expectedChar, isCorrect) {
	const code = CHAR_TO_CODE.get(expectedChar);
	const data = code && KEYS.get(code);
	if (!data) return;

	data.errors.total++;
	if (!isCorrect) data.errors.mistakes++;

	const rate = data.errors.mistakes / data.errors.total;
	data.dom.keyElement.style.setProperty("--tint-color", getErrorTintColor(rate));
}

// Setup function that runs once after the DOM finishes initializing
async function setup() {
	setupKeys(); // sets up the structure for all required fields on the virtual keyboard
	createVirtualKeyboard();
	populateCharLookup(); // creates a lookup table to grab keys from a raw character
	setupEndSessionControls();
	showSessionOverlay();

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);
	window.addEventListener("blur", handleBlur);

	loadUserStats();
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

// Helper function called by the Event Listener for keydown events
//
// e - the key event propagated from the EventListener
function handleKeyDown(e) {
	// give up input if the user is typing inside some form control
	const active = document.activeElement;
	const isTypingElsewhere = active && (
		active.tagName === "INPUT" ||
		active.tagName === "TEXTAREA" ||
		active.isContentEditable
	);
	if (isTypingElsewhere) return;

	// play the keypress animation on the virtual keyboard
	const data = KEYS.get(e.code);
	const keyElement = data?.dom.keyElement;
	if (keyElement) keyElement.classList.add("pressed");

	// pauses the typing test
	if (document.getElementById("errorDialog").open || document.getElementById("endSessionDialog").open) return;
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

	handleCharacterInput(e, currentSpan);

	if (app.visibleChunks[0].text.length === 0) {
		cycleChunk();
		scrollToCursor();
	}
};

// Helper function called by the Event Listener for keyup events
// reverts the virtual keyboard key back to its unpressed state
//
// e - the key event propagated from the EventListener
function handleKeyUp(e) {
	const data = KEYS.get(e.code);
	const keyElement = data?.dom.keyElement;
	if (keyElement) keyElement.classList.remove("pressed");
};

// Helper function called by the Event Listener when the window loses focus
// if the window loses focus keyup will never fire, clear every pressed key manually
function handleBlur() {
	KEYS.forEach(data => data.dom.keyElement.classList.remove("pressed"));
};

// Pause the app if the search dialog is opened
document.addEventListener("focusin", (e) => {
	const el = e.target;
	const isTypingElsewhere = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
	if (isTypingElsewhere && app.sessionActive && !app.isPaused) {
		togglePause();
	}
});

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
