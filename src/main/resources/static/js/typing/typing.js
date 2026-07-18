import { appState as app, inputState as input, bufferState } from './state.js';
import { cycleChunk, populateBuffer, loadSelectedBook, renderChunks } from './buffer.js';
import { statsConstants as stat, uiConstants as ui, bufferConstants as buf } from './constants.js';
import { showSessionOverlay, beginSessionSelect } from './session.js';
import { updateBookProgress, updateStats } from './progress.js';

function togglePause() {
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
		app.isPaused = false;
		typingInterface.style.opacity = "1.0";
		// start the cursor flashing again
		typingInterface.classList.remove("interface-paused");
		pauseInstructions.style.display = "block";
		if (pauseIndicator) pauseIndicator.style.display = "none";
	}
}

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


// Dynamic colour generation for incorrect characters moving from yellow down to red
// 
// Params: strikes is an integer corresponding to the number of incorrect attempts made to type a character
// Returns: a String representing a CSS RGB colour
function getMistakeColour(strikes) {
	// decrease green each time until it hits 0
	const green = Math.max(0, ui.MAX_GREEN - (strikes * ui.MISTAKE_STEP));
	return `rgb(255, ${green}, 0)`;
}

// Play an animation and add iterative styling to a character based on how many incorrect attempts have been made
//
// Params: span is the Span DOM element corresponding to the incorrectly typed character
// currentTypingAttempt is an integer corresponding to how many incorrect attempts have been made
function handleTypo(span, currentTypingAttempt) {
	// space needs the entire background changed or the user won't see any visual indicator
	const isSpace = span.textContent === " " || span.textContent === "\u00A0";

	let mistakeColour = getMistakeColour(currentTypingAttempt);

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

async function setup() {
	showSessionOverlay();
	if (!await loadSelectedBook()) {
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

/* ==================
/  Event Listeners
/  ==================
*/
{
	// tracks if the user has typed this character incorrectly already
	let currentTypingAttempt = 0;

	window.addEventListener("keydown", (e) => {
		// pauses the typing test
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

		if (!app.trackingStats) {
			app.trackingStats = true;
			app.startTime = Date.now();
			app.intervalId = setInterval(updateStats, stat.STAT_UPDATE_INTERVAL);
		}

		//grab  the next character and its corresponding DOM element to check for correctness
		const targetCharacter = app.visibleChunks[0].text[0];
		const currentSpan = app.spanElements[input.currentSpanPosition];

		// if we run past the available spans somehow, return to avoid a crash
		if (!currentSpan) return;

		// style the current character based on whether it was typed correctly (1 means correct)
		const isCorrect = (e.key === targetCharacter) & 1;
		if (isCorrect) {
			currentTypingAttempt = 0;

			// remove the character now that we're done with it
			app.visibleChunks[0].text.shift();

			currentSpan.classList.remove("cursor");
			currentSpan.classList.add("correct")
			app.sessionCorrectKeystrokes++;
			app.sessionKeystrokes++;
			if (targetCharacter === " ") app.currentTypedWordIndex++;

			const nextSpan = app.spanElements[input.currentSpanPosition + 1];
			if (nextSpan && nextSpan.offsetTop > currentSpan.offsetTop) {
				// scrolls the screen down slightly
				const typingInterface = document.getElementById("typing-interface");
				typingInterface.scrollTop = nextSpan.offsetTop - ui.LINE_HEIGHT;
			}
			if (nextSpan) nextSpan.classList.add("cursor");

			input.currentSpanPosition++;
			updateBookProgress(app.currentTypedWordIndex);

			if (app.visibleChunks[0].text.length === 0) {
				cycleChunk();
			}
		} else {
			app.sessionKeystrokes++;
			currentTypingAttempt++;
			handleTypo(currentSpan, currentTypingAttempt);
		};
	});
}


/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
