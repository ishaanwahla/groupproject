
/* ==================
/  Constants & Global Variables
/  ==================
*/
// Data Structures
// ---------------
const textBuffer = new Array(); // an array of objects representing the fetched text

const CHUNK_SIZE = 20; // the number of words per chunk
const TARGET_BUFFER_SIZE = 5; // number of chunks to maintain in reserve

// DOM & Visual Elements
// ---------------------
const LINE_HEIGHT = 40; // line height in pixels
<<<<<<< HEAD
const MAX_VISIBILE_CHUNKS = 4; // number of chunks rendered ahead
=======
const MAX_VISIBILE_CHUNKS = 3; // desired number of chunks visible on screen at one time

// the amount in pixels to animate a character on an incorrect guess
const WOBBLE_AMT = 4;
const HALF_WOBBLE_AMT = WOBBLE_AMT / 2;
const WOBBLE_DURATION = 150;

// RGB green value to subtract from when generating mistake colour for typos
const MAX_GREEN = 255;
const MISTAKE_STEP = 64; // amount of green to remove on each attempt

>>>>>>> cb5af29 (feat: add styling and animation for typos)
let currentChunkId = 0;
let visibleChunks = new Array(); // holds the chunks displayed on screen
let selectedCollectionBook = null;
let reachedEndOfBook = false;
let currentTypedWordIndex = 0;

// holds span HTML elements for individual characters and tracks the position
let spanElements = new Array();
let currentSpanPosition = 0;

// Stats & Time Tracking
// ---------------------
const MAX_ACCURACY = 100;
const MS_PER_MINUTE = 60000; // used to convert millisecond measures to minutes for wpm
const CHARS_PER_WORD = 5; // amount of characters to count as 1 word for wpm

const STAT_UPDATE_INTERVAL = 1000; // 1 second
const STAT_SAVE_INTERVAL = 5000;

const PAUSED_OPACITY = 0.3;

let trackingStats = false;
let startTime = null;
let intervalId = null;

// session scoped accuracy variables
let sessionKeystrokes = 0;
let sessionCorrectKeystrokes = 0;

let isPaused = false;

// function for saving user stats in DB
const throttledSaveUserStats = throttleFunctionCall(saveUserStats, STAT_SAVE_INTERVAL);
let sessionActive = false;
let isEndlessMode = false;
let remainingSeconds = 0;

async function fetchText(chunkId) {
	try {
		const response = await fetch(`/api/collection/${selectedCollectionBook.id}/chunks?chunk=${chunkId}`);
		if (!response.ok) throw new Error("Network response returned error");
		const chunk = await response.json();
		skipCompletedWords(chunk);
		reachedEndOfBook = chunk.endOfBook;
		return chunk;
	} catch (error) {
		console.error("Failed to fetch text:", error);
		return null;
	}
}

// function for event handlers to call to save user data
async function saveUserStats(wpm, accuracy) {
	try {
		await fetch('/api/typing/stats', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ wpm, accuracy })
		});
	} catch (error) {
		console.error("Failed to save user stats:", error);
	}
}

function skipCompletedWords(chunk) {
	const chunkStart = chunk.chunkId * CHUNK_SIZE;
	const wordsToSkip = Math.max(0, currentTypedWordIndex - chunkStart);
	let skippedWords = 0;
	let charactersToSkip = 0;

	while (charactersToSkip < chunk.text.length && skippedWords < wordsToSkip) {
		if (chunk.text[charactersToSkip] === " ") skippedWords++;
		charactersToSkip++;
	}
	if (charactersToSkip > 0) chunk.text = chunk.text.slice(charactersToSkip);
}

/* ==================
/  Functions
/  ==================
*/

// Refills the buffer when it gets too low
async function populateBuffer() {
	while (textBuffer.length < TARGET_BUFFER_SIZE && !reachedEndOfBook) {
		const newChunk = await fetchText(currentChunkId);
		if (!newChunk || newChunk.text.length === 0) break;
		textBuffer.push(newChunk);
		currentChunkId++;
	}
}

// Discards old chunks and repopulates buffer, adds new spans to NodeList for rendering
function cycleChunk() {
	const completedChunk = visibleChunks.shift();
	if (completedChunk) saveReadingProgress(completedChunk.nextWordIndex);

	// prepare a reserve chunk so we don't run out while typing
	if (textBuffer.length > 0) {
		const newChunk = textBuffer.shift();
		visibleChunks.push(newChunk);

		populateBuffer();

		// add new chunk to the very bottom of the DOM
		const chunkContainer = document.getElementById("chunk-container");
		chunkContainer.appendChild(createChunkPageElement(newChunk));

		// populate the new letters into the array for the event handler to use
		spanElements = Array.from(chunkContainer.querySelectorAll("span"));
	}
	if (visibleChunks.length === 0 && textBuffer.length === 0 && reachedEndOfBook) endSession();
}

async function saveReadingProgress(currentWordIndex) {
	if (!selectedCollectionBook || currentWordIndex <= selectedCollectionBook.currentWordIndex) return;
	try {
		const response = await fetch(`/api/collection/${selectedCollectionBook.id}/progress`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentWordIndex }),
			keepalive: true
		});
		if (!response.ok) throw new Error("Progress update returned error");
		selectedCollectionBook.currentWordIndex = Math.max(
			selectedCollectionBook.currentWordIndex, currentWordIndex);
	} catch (error) {
		console.error("Failed to save reading progress:", error);
	}
}

function updateBookProgress(currentWordIndex) {
	const progressCircle = document.querySelector('.progress-circle');
	const progressText = document.querySelector('.progress-text');
	if (!progressCircle || !progressText || !selectedCollectionBook?.totalWords) return;

	const percentage = Math.min(100, Math.max(0,
		currentWordIndex * 100 / selectedCollectionBook.totalWords));
	const wholePercentage = Math.round(percentage);
	progressCircle.style.setProperty('--progress', `${wholePercentage}%`);
	progressText.textContent = `${wholePercentage}%`;
}

async function loadSelectedBook() {
	try {
		const response = await fetch('/api/collection');
		if (!response.ok) return false;
		const collection = await response.json();
		const requestedId = Number(new URLSearchParams(window.location.search).get('book'));
		selectedCollectionBook = collection.find(book => book.id === requestedId) || collection[0];
		if (!selectedCollectionBook) return false;
		currentChunkId = Math.floor(selectedCollectionBook.currentWordIndex / CHUNK_SIZE);
		currentTypedWordIndex = selectedCollectionBook.currentWordIndex;
		document.querySelector('.book-name').textContent = selectedCollectionBook.title;
		document.querySelector('.author-name').textContent = `Author: ${selectedCollectionBook.authors.join(', ') || 'Unknown'}`;
		updateBookProgress(selectedCollectionBook.currentWordIndex);
		const cover = document.querySelector('.current-book-cover');
		if (selectedCollectionBook.coverUrl) {
			cover.style.backgroundImage = `url("${selectedCollectionBook.coverUrl.replaceAll('"', '')}")`;
			cover.style.backgroundSize = 'cover';
			cover.style.backgroundPosition = 'center';
		}
		return true;
	} catch (error) {
		console.error("Failed to load collection:", error);
		return false;
	}
}

// Creates a DOM element (div) and appends individual character spans to it
function createChunkPageElement(chunk) {
	const chunkDiv = document.createElement("div");
	chunkDiv.classList.add("chunk-block");
	chunkDiv.style.display = "inline";

	chunk.text.forEach(char => {
		const span = document.createElement("span");
		span.textContent = char;
		chunkDiv.appendChild(span);
	});

	return chunkDiv;
}

// Renders chunks to the screen by preparing a DOM fragment ahead of time
function renderChunks() {
	const chunkContainer = document.getElementById("chunk-container");
	chunkContainer.textContent = "";

	// creates a DOM tree in memory, don't worry about rendering until we're ready
	const fragment = document.createDocumentFragment();

	// iterate through the 3 next chunks to be rendered
	visibleChunks.forEach(chunk => {
		fragment.appendChild(createChunkPageElement(chunk));
	});

	// create a NodeList. This should be easier for the event listener to index into
	spanElements = Array.from(fragment.querySelectorAll("span"));
	chunkContainer.appendChild(fragment);

	// populate the cursor on the first screen draw
	if (spanElements.length > 0) {
		spanElements[0].classList.add("cursor");
	}
}

function togglePause() {
	if (!sessionActive) return; // wait until the user chooses a session

	const pauseIndicator = document.getElementById("pause-indicator");
	const pauseInstructions = document.getElementById("pause-instructions");
	const typingInterface = document.getElementById("typing-interface");

	if (!isPaused) { // Pause
		isPaused = true;
		typingInterface.style.opacity = `${PAUSED_OPACITY}`;
		// this class will pause the cursor blinking animation
		typingInterface.classList.add("interface-paused");
		pauseInstructions.style.display = "none";
		if (pauseIndicator) pauseIndicator.style.display = "block";
	} else { // Resume
		isPaused = false;
		typingInterface.style.opacity = "1.0";
		// start the cursor flashing again
		typingInterface.classList.remove("interface-paused");
		pauseInstructions.style.display = "block";
		if (pauseIndicator) pauseIndicator.style.display = "none";
	}
}

// formats a whole number of seconds as M:SS (or returns the infinity symbol for endless mode)
function formatTime(totalSeconds) {
	if (isEndlessMode) return "∞";

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// called from the event handler periodically to calculate accuracy and set the wpm indicator
function updateStats() {
	if (isPaused || !startTime) return;

	const timeElapsedMinutes = (Date.now() - startTime) / MS_PER_MINUTE;
	if (timeElapsedMinutes <= 0) return;

	// just count 5 characters as a word for now... some other typing tests seem to use this
	const wpm = Math.round((sessionKeystrokes / CHARS_PER_WORD) / timeElapsedMinutes);

	const accuracy = sessionKeystrokes > 0
		? Math.round((sessionCorrectKeystrokes / sessionKeystrokes) * MAX_ACCURACY)
		: MAX_ACCURACY;

	const wpmValue = document.getElementById("wpm-value");
	const accuracyValue = document.getElementById("accuracy-value");
	const timeValue = document.getElementById("time-value");

	if (wpmValue) wpmValue.textContent = wpm;
	if (accuracyValue) accuracyValue.textContent = accuracy;

	if (!isEndlessMode) {
		remainingSeconds = Math.max(0, remainingSeconds - 1);
	}
	if (timeValue) timeValue.textContent = formatTime(remainingSeconds);

	if (!isEndlessMode && remainingSeconds === 0) {
		endSession();
	}

	throttledSaveUserStats(wpm, accuracy);
}

// Gatekeeps function calls to improve performance
// params: takes a function, and an interger representing milliseconds between each function call
function throttleFunctionCall(func, interval) {
	let inCooldown = false;

	// a "closure" - basically a private scope the function holds to track its own cooldown state
	return function(...args) {
		if (inCooldown) return;
		inCooldown = true;

		func.apply(this, args);

		setTimeout(() => { inCooldown = false; }, interval);
	};
}


// Sets up event listeners for the session start UI elements
function beginSessionSelect() {
	const presetButtons = document.querySelectorAll(".session-preset-btn");
	const customInput = document.getElementById("custom-duration-input");
	const customButton = document.getElementById("custom-duration-btn");
	const endlessButton = document.getElementById("endless-mode-btn");

	presetButtons.forEach(button => {
		button.addEventListener("click", () => {
			const seconds = parseInt(button.dataset.duration, 10);
			startSession(seconds, false);
		});
	});

	customButton.addEventListener("click", () => {
		const minutes = parseInt(customInput.value, 10);
		if (isNaN(minutes) || minutes < 1 || minutes > 300) {
			const message = document.getElementById("session-select-message");
			if (message) message.textContent = "Enter a value between 1 and 300 minutes";
			return;
		}
		startSession(minutes * 60, false);
	});

	customInput.addEventListener("input", () => {
		const message = document.getElementById("session-select-message");
		if (message) message.textContent = "Ready to start?";
	});

	endlessButton.addEventListener("click", () => {
		startSession(0, true);
	});
}


function scrollToCursor() {
	const typingInterface = document.getElementById("typing-interface");
	const currentSpan = spanElements[currentSpanPosition];

	if (typingInterface && currentSpan) {
		typingInterface.scrollTop = currentSpan.offsetTop - LINE_HEIGHT;
	} else if (typingInterface) {
		// fallback in case its a fresh session
		typingInterface.scrollTop = 0;
	}
}

// Reset the scroll position and show the session start overlay with a custom message
function showSessionOverlay(message) {
	scrollToCursor();

	const messageEl = document.getElementById("session-select-message");
	if (messageEl && message) messageEl.textContent = message;

	const overlay = document.getElementById("session-select-overlay");
	if (overlay) overlay.style.display = "flex";
}

// for now: send the user back to the same selection as starting a new session
function endSession() {
	sessionActive = false;
	trackingStats = false;
	clearInterval(intervalId);
	saveReadingProgress(currentTypedWordIndex);

	showSessionOverlay("Continue typing?");
}

// starts the actual timer
function startSession(durationSeconds, endless) {
	sessionKeystrokes = 0;
	sessionCorrectKeystrokes = 0;

	isEndlessMode = endless;
	remainingSeconds = endless ? 0 : durationSeconds;
	sessionActive = true;

	const wpmValue = document.getElementById("wpm-value");
	const accuracyValue = document.getElementById("accuracy-value");
	const timeValue = document.getElementById("time-value");

	if (wpmValue) wpmValue.textContent = "0";
	if (accuracyValue) accuracyValue.textContent = "100";
	if (timeValue) timeValue.textContent = formatTime(remainingSeconds);

	const overlay = document.getElementById("session-select-overlay");
	if (overlay) overlay.style.display = "none";
}

// Dynamic colour generation for incorrect characters moving from yellow down to red
// 
// Params: strikes is an integer corresponding to the number of incorrect attempts made to type a character
// Returns: a String representing a CSS RGB colour
function getMistakeColour(strikes) {
	// decrease green each time until it hits 0
	const green = Math.max(0, MAX_GREEN - (strikes * MISTAKE_STEP));
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
			{ transform: 'translateX(-${WOBBLE_AMT}px)' },
			{ transform: 'translateX(${WOBBLE_AMT}px)' },
			{ transform: 'translateX(-${HALF_WOBBLE_AMT}px)' },
			{ transform: 'translateX(${HALF_WOBBLE_AMT}px)' },
			{ transform: 'translateX(0px)' }
		],
		{
			duration: WOBBLE_DURATION,
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
	while (visibleChunks.length < MAX_VISIBILE_CHUNKS && textBuffer.length > 0) {
		visibleChunks.push(textBuffer.shift());
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
		if (!sessionActive) return; // wait until the user chooses a session

		// should ignore non-standard keys (shift, alt)
		// and stop the page from scrolling with space
		if (e.key.length !== 1 || isPaused) return;
		e.preventDefault();

		if (visibleChunks.length === 0) return;

		if (!trackingStats) {
			trackingStats = true;
			startTime = Date.now();
			intervalId = setInterval(updateStats, STAT_UPDATE_INTERVAL);
		}

		//grab  the next character and its corresponding DOM element to check for correctness
		const targetCharacter = visibleChunks[0].text[0];
		const currentSpan = spanElements[currentSpanPosition];

		// if we run past the available spans somehow, return to avoid a crash
		if (!currentSpan) return;

		// style the current character based on whether it was typed correctly (1 means correct)
		const isCorrect = (e.key === targetCharacter) & 1;
		if (isCorrect) {
			currentTypingAttempt = 0;

			// remove the character now that we're done with it
			visibleChunks[0].text.shift();

			currentSpan.classList.remove("cursor");
			currentSpan.classList.add("correct")
			sessionCorrectKeystrokes++;
			sessionKeystrokes++;
			if (targetCharacter === " ") currentTypedWordIndex++;

			const nextSpan = spanElements[currentSpanPosition + 1];
			if (nextSpan && nextSpan.offsetTop > currentSpan.offsetTop) {
				// scrolls the screen down slightly
				const typingInterface = document.getElementById("typing-interface");
				typingInterface.scrollTop = nextSpan.offsetTop - LINE_HEIGHT;
			}
			if (nextSpan) nextSpan.classList.add("cursor");

			currentSpanPosition++;
			updateBookProgress(currentTypedWordIndex);

			if (visibleChunks[0].text.length === 0) {
				cycleChunk();
			}
		} else {
			sessionKeystrokes++;
			currentTypingAttempt++;
			handleTypo(currentSpan, currentTypingAttempt);
		};
	});
}

window.addEventListener("pagehide", () => {
	saveReadingProgress(currentTypedWordIndex);
});

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
