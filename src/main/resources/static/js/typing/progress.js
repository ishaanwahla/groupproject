import { appState as app } from './state.js';
import { statsConstants as stat, bufferConstants as buf } from './constants.js';
import { endSession, formatTime } from './session.js';
// function for saving user stats in DB
const throttledSaveUserStats = throttleFunctionCall(saveUserStats, stat.STAT_SAVE_INTERVAL);

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


export async function saveReadingProgress(currentWordIndex) {
	if (!app.selectedCollectionBook || currentWordIndex <= app.selectedCollectionBook.currentWordIndex) return;
	try {
		const response = await fetch(`/api/collection/${app.selectedCollectionBook.id}/progress`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentWordIndex }),
			keepalive: true
		});
		if (!response.ok) throw new Error("Progress update returned error");
		app.selectedCollectionBook.currentWordIndex = Math.max(
			app.selectedCollectionBook.currentWordIndex, currentWordIndex);
	} catch (error) {
		console.error("Failed to save reading progress:", error);
	}
}

export function updateBookProgress(currentWordIndex) {
	const progressCircle = document.querySelector('.progress-circle');
	const progressText = document.querySelector('.progress-text');
	if (!progressCircle || !progressText || !app.selectedCollectionBook?.totalWords) return;

	const percentage = Math.min(stat.MAX_ACCURACY, Math.max(0,
		currentWordIndex * stat.MAX_ACCURACY / app.selectedCollectionBook.totalWords));
	const wholePercentage = Math.round(percentage);
	progressCircle.style.setProperty('--progress', `${wholePercentage}%`);
	progressText.textContent = `${wholePercentage}%`;
}

// called from the event handler periodically to calculate accuracy and set the wpm indicator
export function updateStats() {
	if (app.isPaused || !app.startTime) return;

	const timeElapsedMinutes = (Date.now() - app.startTime) / stat.MS_PER_MINUTE;
	if (timeElapsedMinutes <= 0) return;

	// just count 5 characters as a word for now... some other typing tests seem to use this
	const wpm = Math.round((app.sessionKeystrokes / stat.CHARS_PER_WORD) / timeElapsedMinutes);

	const accuracy = app.sessionKeystrokes > 0
		? Math.round((app.sessionCorrectKeystrokes / app.sessionKeystrokes) * stat.MAX_ACCURACY)
		: stat.MAX_ACCURACY;

	const wpmValue = document.getElementById("wpm-value");
	const accuracyValue = document.getElementById("accuracy-value");
	const timeValue = document.getElementById("time-value");

	if (wpmValue) wpmValue.textContent = wpm;
	if (accuracyValue) accuracyValue.textContent = accuracy;

	if (!app.isEndlessMode) {
		app.remainingSeconds = Math.max(0, app.remainingSeconds - 1);
	}
	if (timeValue) timeValue.textContent = formatTime(app.remainingSeconds);

	if (!app.isEndlessMode && app.remainingSeconds === 0) {
		endSession(wpm, accuracy);
		return;
	}

	throttledSaveUserStats(wpm, accuracy);
}

export async function loadUserStats() {
	try {
		const response = await fetch('/api/auth/me');
		if (!response.ok) return;
		const user = await response.json();
		app.personalBestWpm = user.bestWpm || 0;
	} catch (error) {
		console.error("Failed to load user stats:", error);
	}
}


// function for event handlers to call to save user data
export async function saveUserStats(wpm, accuracy, completed = false, wordsTyped = 0, mistakes = 0) {
	try {
		await fetch('/api/typing/stats', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ wpm, accuracy, completed, wordsTyped, mistakes })
		});
	} catch (error) {
		console.error("Failed to save user stats:", error);
	}
}

export function skipCompletedWords(chunk) {
	const chunkStart = chunk.chunkId * buf.CHUNK_SIZE;
	const wordsToSkip = Math.max(0, app.currentTypedWordIndex - chunkStart);
	let skippedWords = 0;
	let charactersToSkip = 0;

	while (charactersToSkip < chunk.text.length && skippedWords < wordsToSkip) {
		if (chunk.text[charactersToSkip].display === " ") skippedWords++;
		charactersToSkip++;
	}
	if (charactersToSkip > 0) chunk.text = chunk.text.slice(charactersToSkip);
}


window.addEventListener("pagehide", () => {
	saveReadingProgress(app.currentTypedWordIndex);
});
