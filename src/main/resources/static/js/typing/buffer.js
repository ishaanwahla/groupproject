import { appState as app, bufferState as bufState, inputState as input } from './state.js';
import { bufferConstants as buf, uiConstants as ui } from './constants.js';
import { togglePause } from './typing.js';
import { skipCompletedWords, saveReadingProgress, updateBookProgress } from './progress.js';
import { endSession, showErrorDialog } from './session.js';
import { textToTypingUnits } from './text.js';


async function fetchText(startWordIndex) {
	try {
		const response = await fetch(
			`/api/collection/${app.selectedCollectionBook.id}/chunks?startWordIndex=${startWordIndex}&charsPerLine=${buf.CHARS_PER_LINE}`
		);
		if (!response.ok) throw new Error("Network response returned error");
		const chunk = await response.json();
		chunk.text = textToTypingUnits(chunk.text);
		skipCompletedWords(chunk);
		bufState.reachedEndOfBook = chunk.endOfBook;
		return chunk;
	} catch (error) {
		console.error("Failed to fetch text:", error);
		return null;
	}
}

// Refills the buffer when it gets too low
export async function populateBuffer() {
	let chunksAdded = 0;
	while (bufState.textBuffer.length < buf.TARGET_BUFFER_SIZE && !bufState.reachedEndOfBook) {
		const newChunk = await fetchText(bufState.currentChunkId);
		if (!newChunk || newChunk.text.length === 0) break;
		bufState.textBuffer.push(newChunk);
		bufState.currentChunkId = newChunk.nextWordIndex;
		chunksAdded++;
	}
	// display an error if we can't add anything to the buffer at all (as in: empty)
	if (chunksAdded === 0 && bufState.textBuffer.length === 0 && !bufState.reachedEndOfBook) {
		if (!app.isPaused) togglePause();
		showErrorDialog("We're having trouble loading more of the book. Please check your connection and try again.");
		return;
	}

	// reset the error state
	if (app.bufferError && bufState.textBuffer.length > 0) {
		app.bufferError = false;
	}
}


// Discards old chunks and repopulates buffer, adds new spans to NodeList for rendering
export function cycleChunk() {
	const chunkContainer = document.getElementById("chunk-container");

	const completedChunk = app.visibleChunks.shift();
	if (completedChunk) {
		saveReadingProgress(completedChunk.nextWordIndex);
		trimAboveViewport();
	}

	if (bufState.textBuffer.length > 0) {
		const newChunk = bufState.textBuffer.shift();
		app.visibleChunks.push(newChunk);
		populateBuffer();
		chunkContainer.appendChild(createChunkPageElement(newChunk));
		app.spanElements = Array.from(chunkContainer.querySelectorAll("span.char-span"));
	}
	if (app.visibleChunks.length === 0 && bufState.textBuffer.length === 0 && bufState.reachedEndOfBook) endSession();
}

// Creates a DOM element (div) and appends individual character spans to it
function createChunkPageElement(chunk) {
	const chunkDiv = document.createElement("div");
	chunkDiv.classList.add("chunk-block");
	//chunkDiv.style.display = "inline";

	let wordWrapper = document.createElement("span");
	wordWrapper.classList.add("word-block");
	chunkDiv.appendChild(wordWrapper);

	chunk.text.forEach(unit => {
		const span = document.createElement("span");
		span.classList.add("char-span");
		span.textContent = unit.display;
		wordWrapper.appendChild(span);

		// the <wbr> element will manually add a linebreak
		// needed since browsers seem to handle wrap behaviour slightly differently.
		if (unit.display === " ") {
			chunkDiv.appendChild(document.createElement("wbr"));

			wordWrapper = document.createElement("span");
			wordWrapper.classList.add("word-block");
			chunkDiv.appendChild(wordWrapper);
		}
	});

	return chunkDiv;
}

// Renders chunks to the screen by preparing a DOM fragment ahead of time
export function renderChunks() {
	const chunkContainer = document.getElementById("chunk-container");
	chunkContainer.textContent = "";

	// creates a DOM tree in memory, don't worry about rendering until we're ready
	const fragment = document.createDocumentFragment();

	// iterate through the 3 next chunks to be rendered
	app.visibleChunks.forEach(chunk => {
		fragment.appendChild(createChunkPageElement(chunk));
	});

	// create a NodeList. This should be easier for the event listener to index into
	app.spanElements = Array.from(fragment.querySelectorAll("span.char-span"));
	chunkContainer.appendChild(fragment);

	// populate the cursor on the first screen draw
	if (app.spanElements.length > 0) {
		app.spanElements[0].classList.add("cursor");
	}
}

export async function loadSelectedBook() {
	try {
		const response = await fetch('/api/collection');
		if (!response.ok) return false;
		const collection = await response.json();
		const requestedId = Number(new URLSearchParams(window.location.search).get('book'));
		app.selectedCollectionBook = collection.find(book => book.id === requestedId) || collection[0];
		if (!app.selectedCollectionBook) return false;
		bufState.currentChunkId = app.selectedCollectionBook.currentWordIndex;
		app.currentTypedWordIndex = app.selectedCollectionBook.currentWordIndex;
		document.querySelector('.book-name').textContent = app.selectedCollectionBook.title;
		document.querySelector('.author-name').textContent = `Author: ${app.selectedCollectionBook.authors.join(', ') || 'Unknown'}`;
		updateBookProgress(app.selectedCollectionBook.currentWordIndex);
		const cover = document.querySelector('.current-book-cover');
		if (app.selectedCollectionBook.coverUrl) {
			cover.style.backgroundImage = `url("${app.selectedCollectionBook.coverUrl.replaceAll('"', '')}")`;
			cover.style.backgroundSize = 'cover';
			cover.style.backgroundPosition = 'center';
		}
		return true;
	} catch (error) {
		console.error("Failed to load collection:", error);
		return null;
	}
}

function trimAboveViewport() {
	const spans = app.spanElements;
	const cursorSpan = spans[input.currentSpanPosition];
	if (!cursorSpan) return;

	const safeTop = cursorSpan.offsetTop - (buf.RETAINED_LINES * ui.LINE_HEIGHT);

	let cutIndex = -1;
	for (let i = 0; i < spans.length - 1; i++) {
		if (spans[i].offsetTop >= safeTop) break;
		if (spans[i + 1].offsetTop > spans[i].offsetTop) cutIndex = i;
	}
	if (cutIndex < 0) return;

	for (let i = 0; i <= cutIndex; i++) spans[i].remove();
	input.currentSpanPosition -= (cutIndex + 1);
	app.spanElements = spans.slice(cutIndex + 1);
}
