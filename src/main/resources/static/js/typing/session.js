import { appState as app } from './state.js';
import { sessionConstants as session, statsConstants as stat } from './constants.js';
import { populateBuffer } from './buffer.js';
import { scrollToCursor, togglePause } from './typing.js';
import { saveReadingProgress, saveUserStats } from './progress.js';
import { updateKeyHint } from './keyboard.js';

// Sets up event listeners for the session start UI elements
export function beginSessionSelect() {
	const presetButtons = document.querySelectorAll(".session-preset-btn");
	const customInput = document.getElementById("custom-duration-input");
	const customButton = document.getElementById("custom-duration-btn");
	const endlessButton = document.getElementById("endless-mode-btn");
	const typeAgainButton = document.getElementById("type-again-btn");

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

	typeAgainButton.addEventListener("click", () => {
		showSessionOverlay("Continue typing?");
	});
}
// Sets up End Session button for Endless Mode (and its confirmation dialog).
export function setupEndSessionControls() {
	const endBtn = document.getElementById("end-session-btn");
	const endDialog = document.getElementById("endSessionDialog");
	const confirmBtn = document.getElementById("confirmEndSession");
	const cancelBtn = document.getElementById("cancelEndSession");

	endBtn.addEventListener("click", () => {
		if (!app.isPaused) togglePause();
		endDialog.showModal();
	});

	confirmBtn.addEventListener("click", () => endDialog.close("confirmed"));
	cancelBtn.addEventListener("click", () => endDialog.close("cancelled"));

	endDialog.addEventListener("close", () => {
		if (endDialog.returnValue === "confirmed") {
			endSession();
		}
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
	document.getElementById("session-summary").style.display = "none";
	document.getElementById("session-select-content").style.display = "flex";

	const message = document.getElementById("session-select-message");
	if (message && messageText) message.textContent = messageText;

	const overlay = document.getElementById("session-select-overlay");
	if (overlay) overlay.style.display = "flex";
}

function formatMissedKey(key) {
	if (!key) return "None";
	if (key === " ") return "Space";
	return key.toUpperCase();
}

function showSessionSummary(wpm, accuracy) {
	const mistakes = app.sessionKeystrokes - app.sessionCorrectKeystrokes;
	const mostMissed = Object.entries(app.mistakeCounts)
		.sort((first, second) => second[1] - first[1])[0];
	const isPersonalBest = wpm > app.personalBestWpm;
	app.personalBestWpm = Math.max(app.personalBestWpm, wpm);

	document.getElementById("summary-wpm").textContent = wpm;
	document.getElementById("summary-accuracy").textContent = `${accuracy}%`;
	document.getElementById("summary-personal-best").textContent = app.personalBestWpm;
	document.getElementById("summary-mistakes").textContent = mistakes;
	document.getElementById("summary-words").textContent = app.sessionWordsTyped;
	document.getElementById("summary-correct-keys").textContent = app.sessionCorrectKeystrokes;
	document.getElementById("summary-missed-key").textContent = mostMissed
		? `${formatMissedKey(mostMissed[0])} (${mostMissed[1]})`
		: "None";
	document.getElementById("summary-best-message").textContent = isPersonalBest ? "New personal best!" : "";

	document.getElementById("session-select-content").style.display = "none";
	document.getElementById("session-summary").style.display = "flex";
	document.getElementById("session-select-overlay").style.display = "flex";
}

export function endSession(
	wpm = Number(document.getElementById("wpm-value").textContent) || 0,
	accuracy = Number(document.getElementById("accuracy-value").textContent) || stat.MAX_ACCURACY
) {

	if (app.isPaused) togglePause();
	app.sessionActive = false;
	app.trackingStats = false;
	clearInterval(app.intervalId);
	saveReadingProgress(app.currentTypedWordIndex);
	const mistakes = app.sessionKeystrokes - app.sessionCorrectKeystrokes;
	saveUserStats(wpm, accuracy, true, app.sessionWordsTyped, mistakes, app.mistakeCounts);

	// hide the end session button
	const endBtn = document.getElementById("end-session-btn");
	const sessionControls = document.getElementById("session-controls");
	if (endBtn) {
		endBtn.hidden = true;
		endBtn.disabled = true;
	}
	if (sessionControls) sessionControls.classList.remove("endless");


	showSessionSummary(wpm, accuracy);
}

// starts the actual timer
export function startSession(durationSeconds, endless) {
	app.sessionKeystrokes = 0;
	app.sessionCorrectKeystrokes = 0;
	app.sessionWordsTyped = 0;
	app.mistakeCounts = {};

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

	const endBtn = document.getElementById("end-session-btn");
	const sessionControls = document.getElementById("session-controls");
	if (endBtn) {
		endBtn.hidden = !endless;
		endBtn.disabled = !endless;
	}
	if (sessionControls) sessionControls.classList.toggle("endless", endless);

	updateKeyHint();
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
