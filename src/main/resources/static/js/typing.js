const PLACEHOLDER_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

const CHUNK_SIZE = 20; // the number of words per chunk

const textBuffer = new Array();

// this doesn't need to be async, but dealing with promises makes the logic more consistent for when the backend is ready.
//
// Params: chunkId - an integer representing a place in the blob of text we are grabbing from
// Returns: an object in the form { chunkId: chunkId, text: [...]} where "text" is an array of individual characters
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

function setup() {
	let typingInterface = document.getElementById("typing-interface");
	typingInterface.textContent = PLACEHOLDER_TEXT;
}

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
