
/* ==================
/  Constants & Global Variables
/  ==================
*/
const PLACEHOLDER_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

const textBuffer = new Array(); // an array of objects representing the fetched text

const CHUNK_SIZE = 20; // the number of words per chunk
const BUFFER_THRESHOLD = 3; // signals refilling when buffer drops below this size
const TARGET_BUFFER_SIZE = 5; // number of chunks to maintain in reserve

const LINE_HEIGHT = 40; // line height in pixels
let currentChunkId = 0;
let visibleChunks = new Array(); // holds the 3 chunks displayed on screen

// holds span HTML elements for individual characters and tracks the position
let spanElements = new Array();
let currentSpanPosition = 0;

/* ==================
/  Functions
/  ==================
*/

// Temporary function to simulate fetching text from an API and returning it in chunks
//	
// Params: chunkId - an integer representing a place in the blob of text we are grabbing from
// Returns: an object in the form { chunkId: chunkId, text: [...]} where "text" is an array of individual characters
//
// Note: this doesn't need to be async, but dealing with promises makes the logic more consistent for when the backend is ready.
async function fetchFakeText(chunkId) {
	let words = PLACEHOLDER_TEXT.split(" ");
	let startPosition = (chunkId * CHUNK_SIZE) % words.length;

	const currentChunk = Array.from({ length: CHUNK_SIZE }, (_, i) => {
		const targetPosition = (startPosition + i) % words.length;
		return words[targetPosition];
	});

	// temporarily "reattach" the words
	// then break them up into individual characters
	const characterArray = currentChunk.join(" ").split("");

	return {
		chunkId: chunkId,
		text: characterArray
	};
}

// Refills the buffer when it gets too low
async function populateBuffer() {
	while (textBuffer.length < TARGET_BUFFER_SIZE) {
		const newChunk = await fetchFakeText(currentChunkId);
		textBuffer.push(newChunk);
		currentChunkId++;
	}
}

// Shifts the array and handles scrolling the text
function cycleChunk() {
	visibleChunks.shift();

	// prepare a reserve chunk so we don't run out while typing
	if (textBuffer.length > 0) {
		const freshChunk = textBuffer.shift();
		visibleChunks.push(freshChunk);

		populateBuffer();

		// add new chunk to the very bottom of the dom
		const typingInterface = document.getElementById("typing-interface");
		const chunkDiv = document.createElement("div");
		chunkDiv.classList.add("chunk-block");
		chunkDiv.style.display = "inline";

		freshChunk.text.forEach(char => {
			const span = document.createElement("span");
			span.textContent = char;
			chunkDiv.appendChild(span);
		});

		typingInterface.appendChild(chunkDiv);

		// populate the new letters into the array for the event handler to use
		spanElements = Array.from(typingInterface.querySelectorAll("span"));

	}
}

// Renders chunks to the screen
// by preparing a DOM fragment ahead of time
function renderChunks() {
	const typingInterface = document.getElementById("typing-interface");
	typingInterface.textContent = "";

	// creates a DOM tree in memory, don't worry about rendering until we're ready
	const fragment = document.createDocumentFragment();

	// iterate through the 3 next chunks to be rendered
	visibleChunks.forEach(chunk => {
		const chunkDiv = document.createElement("div");
		chunkDiv.classList.add("chunk-block");
		chunkDiv.style.display = "inline";

		chunk.text.forEach(char => {
			const span = document.createElement("span");
			span.textContent = char;
			chunkDiv.appendChild(span);
		});

		fragment.appendChild(chunkDiv);
	});

	// create a NodeList. This should be easier for the event listener to index into
	spanElements = Array.from(fragment.querySelectorAll("span"));

	typingInterface.appendChild(fragment);
}

async function setup() {
	await populateBuffer();

	// grab 3 chunks to populate the screen with text
	while (visibleChunks.length < 3 && textBuffer.length > 0) {
		visibleChunks.push(textBuffer.shift());
	}

	renderChunks();
	populateBuffer();
}

/* ==================
/  Event Listeners
/  ==================
*/

window.addEventListener("keydown", (e) => {
	// should ignore non-standard keys (shift, alt)
	// and stop the page from scrolling with space
	if (e.key.length !== 1) return;
	e.preventDefault();

	if (visibleChunks.length === 0) return;

	// grab the next character and it's corresponding DOM element for styling purposes
	const targetCharacter = visibleChunks[0].text.shift();
	const currentSpan = spanElements[currentSpanPosition];

	// if we run past the spans somehow, return to avoid a crash
	if (!currentSpan) return;

	// style the current character based on whether it was typed correctly (1 means correct)
	const isCorrect = (e.key === targetCharacter) & 1;
	isCorrect ? currentSpan.classList.add("correct") :
		currentSpan.classList.add("incorrect");

	const nextSpan = spanElements[currentSpanPosition + 1];
	if (nextSpan && nextSpan.offsetTop > currentSpan.offsetTop) {
		// scrolls the screen down slightly
		const typingInterface = document.getElementById("typing-interface");
		typingInterface.scrollTop = nextSpan.offsetTop - LINE_HEIGHT;
	}

	currentSpanPosition++;

	if (visibleChunks[0].text.length === 0) {
		cycleChunk();
	}
});

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
