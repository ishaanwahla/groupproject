import { appState as app } from './state.js';
import { sessionConstants as session, statsConstants as stat } from './constants.js';
import { populateBuffer } from './buffer.js';
import { scrollToCursor } from './typing.js';
import { saveReadingProgress, saveUserStats } from './progress.js';

// Sets up event listeners for the session start UI elements
export function beginSessionSelect() {
	const presetButtons = document.querySelectorAll(".session-preset-btn");
	const customInput = document.getElementById("custom-duration-input");
	const customButton = document.getElementById("custom-duration-btn");
	const endlessButton = document.getElementById("endless-mode-btn");

	presetButtons.forEach(button => {
		button.addEventListener("click", () => {
			const seconds = parseInt(button.dataset.duration, session.RADIX);
			startSession(seconds, false);
		});
	});

	customButton.addEventListener("click", () => {
		const minutes = parseInt(customInput.value, session.RADIX);
		if (isNaN(minutes) || minutes < 1 || minutes > session.MAX_CUSTOM_MINUTES) {
			const message = document.getElementById("session-select-message");
			if (message) message.textContent = `Enter a value between 1 and ${session.MAX_CUSTOM_MINUTES} minutes`;
			return;
		}
		startSession(minutes * session.SECONDS_PER_MIN, false);
	});

	customInput.addEventListener("input", () => {
		const message = document.getElementById("session-select-message");
		if (message) message.textContent = "Ready to start?";
	});

	endlessButton.addEventListener("click", () => {
		startSession(0, true);
	});
}

// formats a whole number of seconds as M:SS (or returns the infinity symbol for endless mode)
export function formatTime(totalSeconds) {
	if (app.isEndlessMode) return "∞";

	const minutes = Math.floor(totalSeconds / session.SECONDS_PER_MIN);
	const seconds = totalSeconds % session.SECONDS_PER_MIN;
	return `${minutes}:${seconds.toString().padStart(session.LABEL_PADDING, "0")}`;
}

// Reset the scroll position and show the session start overlay with a custom message
export function showSessionOverlay(messageText) {
	scrollToCursor();

	const message = document.getElementById("session-select-message");
	if (message && messageText) message.textContent = messageText;

	const overlay = document.getElementById("session-select-overlay");
	if (overlay) overlay.style.display = "flex";
}

// for now: send the user back to the same selection as starting a new session
export function endSession(wpm, accuracy) {
	app.sessionActive = false;
	app.trackingStats = false;
	clearInterval(app.intervalId);
	saveReadingProgress(app.currentTypedWordIndex);
	saveUserStats(wpm, accuracy);


	showSessionOverlay("Continue typing?");
}

// starts the actual timer
export function startSession(durationSeconds, endless) {
	app.sessionKeystrokes = 0;
	app.sessionCorrectKeystrokes = 0;

	app.isEndlessMode = endless;
	app.remainingSeconds = endless ? 0 : durationSeconds;
	app.sessionActive = true;

	const wpmValue = document.getElementById("wpm-value");
	const accuracyValue = document.getElementById("accuracy-value");
	const timeValue = document.getElementById("time-value");

	if (wpmValue) wpmValue.textContent = "0";
	if (accuracyValue) accuracyValue.textContent = `${stat.MAX_ACCURACY}`;
	if (timeValue) timeValue.textContent = formatTime(app.remainingSeconds);

	const overlay = document.getElementById("session-select-overlay");
	if (overlay) overlay.style.display = "none";
}

export function showErrorDialog(message) {
	const dialog = document.getElementById("errorDialog");
	document.getElementById("errorDialogMessage").textContent = message;
	dialog.showModal();
	dialog.addEventListener("close", handleErrorDialogClosed, { once: true });
}

// attempt to populate the buffer one more time
function handleErrorDialogClosed() {
	populateBuffer();
}

