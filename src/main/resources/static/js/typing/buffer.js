import { appState as app, bufferState as bufState } from './state.js';
import { bufferConstants as buf } from './constants.js';
import { skipCompletedWords, saveReadingProgress, updateBookProgress } from './progress.js';
import { endSession } from './session.js';

async function fetchText(chunkId) {
	try {
		const response = await fetch(`/api/collection/${app.selectedCollectionBook.id}/chunks?chunk=${chunkId}`);
		if (!response.ok) throw new Error("Network response returned error");
		const chunk = await response.json();
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
	while (bufState.textBuffer.length < buf.TARGET_BUFFER_SIZE && !bufState.reachedEndOfBook) {
		const newChunk = await fetchText(bufState.currentChunkId);
		if (!newChunk || newChunk.text.length === 0) break;
		bufState.textBuffer.push(newChunk);
		bufState.currentChunkId++;
	}
}


// Discards old chunks and repopulates buffer, adds new spans to NodeList for rendering
export function cycleChunk() {
	const completedChunk = app.visibleChunks.shift();
	if (completedChunk) saveReadingProgress(completedChunk.nextWordIndex);

	// prepare a reserve chunk so we don't run out while typing
	if (bufState.textBuffer.length > 0) {
		const newChunk = bufState.textBuffer.shift();
		app.visibleChunks.push(newChunk);

		populateBuffer();

		// add new chunk to the very bottom of the DOM
		const chunkContainer = document.getElementById("chunk-container");
		chunkContainer.appendChild(createChunkPageElement(newChunk));

		// populate the new letters into the array for the event handler to use
		app.spanElements = Array.from(chunkContainer.querySelectorAll("span"));
	}
	if (app.visibleChunks.length === 0 && bufState.textBuffer.length === 0 && bufState.reachedEndOfBook) endSession();
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
	app.spanElements = Array.from(fragment.querySelectorAll("span"));
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
		bufState.currentChunkId = Math.floor(app.selectedCollectionBook.currentWordIndex / buf.CHUNK_SIZE);
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
		return false;
	}
}
