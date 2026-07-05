const PLACEHOLDER_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

function setup() {
	let typingInterface = document.getElementById("typing-interface");
	typingInterface.textContent = PLACEHOLDER_TEXT;
}

/* Wait until the page loads before attempting to access DOM elements */
document.addEventListener('DOMContentLoaded', setup);
