//keyboard.js

// Converts from raw text to lookup codes for KEYS
// used for displaying the hint for the next key
const CHAR_TO_CODE = new Map();

// U is an arbitrary unit of width, used to scale each key's SVG
const KEY_WIDTH_U = {
	"letters-numbers": 1,
	"ctrl-alt-super": 1.25,
	"tab-pipe": 1.5,
	"caps": 1.75,
	"backspace": 2,
	"enter-leftshift": 2.3,
	"rightshift": 2.8,
	"space": 6.55,
};


const ROW_LAYOUT = [
	["Escape", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6",
		"Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace"],

	["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI",
		"KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"],

	["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ",
		"KeyK", "KeyL", "Semicolon", "Quote", "Enter"],

	["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM",
		"Comma", "Period", "Slash", "ShiftRight"],

	["ControlLeft", "MetaLeft", "AltLeft", "Space", "AltRight", "MetaRight",
		"ContextMenu", "ControlRight"],
];


const KEYS = new Map([
	// number row
	["Escape", { image: "letters-numbers", symbols: [{ text: "esc", pos: "center" }] }],
	["Digit1", { image: "letters-numbers", symbols: [{ text: "!", pos: "top" }, { text: "1", pos: "bottom" }] }],
	["Digit2", { image: "letters-numbers", symbols: [{ text: "@", pos: "top" }, { text: "2", pos: "bottom" }] }],
	["Digit3", { image: "letters-numbers", symbols: [{ text: "#", pos: "top" }, { text: "3", pos: "bottom" }] }],
	["Digit4", { image: "letters-numbers", symbols: [{ text: "$", pos: "top" }, { text: "4", pos: "bottom" }] }],
	["Digit5", { image: "letters-numbers", symbols: [{ text: "%", pos: "top" }, { text: "5", pos: "bottom" }] }],
	["Digit6", { image: "letters-numbers", symbols: [{ text: "^", pos: "top" }, { text: "6", pos: "bottom" }] }],
	["Digit7", { image: "letters-numbers", symbols: [{ text: "&", pos: "top" }, { text: "7", pos: "bottom" }] }],
	["Digit8", { image: "letters-numbers", symbols: [{ text: "*", pos: "top" }, { text: "8", pos: "bottom" }] }],
	["Digit9", { image: "letters-numbers", symbols: [{ text: "(", pos: "top" }, { text: "9", pos: "bottom" }] }],
	["Digit0", { image: "letters-numbers", symbols: [{ text: ")", pos: "top" }, { text: "0", pos: "bottom" }] }],
	["Minus", { image: "letters-numbers", symbols: [{ text: "_", pos: "top" }, { text: "-", pos: "bottom" }] }],
	["Equal", { image: "letters-numbers", symbols: [{ text: "+", pos: "top" }, { text: "=", pos: "bottom" }] }],
	["Backspace", { image: "backspace", symbols: [{ icon: "fa-delete-left", style: "solid", pos: "center" }] }],

	// top letter row
	["Tab", { image: "tab-pipe", symbols: [{ icon: "fa-arrow-right-to-bracket", style: "solid", pos: "center" }] }],
	["KeyQ", { image: "letters-numbers", symbols: [{ text: "Q", pos: "center" }] }],
	["KeyW", { image: "letters-numbers", symbols: [{ text: "W", pos: "center" }] }],
	["KeyE", { image: "letters-numbers", symbols: [{ text: "E", pos: "center" }] }],
	["KeyR", { image: "letters-numbers", symbols: [{ text: "R", pos: "center" }] }],
	["KeyT", { image: "letters-numbers", symbols: [{ text: "T", pos: "center" }] }],
	["KeyY", { image: "letters-numbers", symbols: [{ text: "Y", pos: "center" }] }],
	["KeyU", { image: "letters-numbers", symbols: [{ text: "U", pos: "center" }] }],
	["KeyI", { image: "letters-numbers", symbols: [{ text: "I", pos: "center" }] }],
	["KeyO", { image: "letters-numbers", symbols: [{ text: "O", pos: "center" }] }],
	["KeyP", { image: "letters-numbers", symbols: [{ text: "P", pos: "center" }] }],
	["BracketLeft", { image: "letters-numbers", symbols: [{ text: "{", pos: "top" }, { text: "[", pos: "bottom" }] }],
	["BracketRight", { image: "letters-numbers", symbols: [{ text: "}", pos: "top" }, { text: "]", pos: "bottom" }] }],
	["Backslash", { image: "tab-pipe", symbols: [{ text: "|", pos: "top" }, { text: "\\", pos: "bottom" }] }],

	// home row
	["CapsLock", { image: "caps", symbols: [{ text: "caps", pos: "center" }] }],
	["KeyA", { image: "letters-numbers", symbols: [{ text: "A", pos: "center" }] }],
	["KeyS", { image: "letters-numbers", symbols: [{ text: "S", pos: "center" }] }],
	["KeyD", { image: "letters-numbers", symbols: [{ text: "D", pos: "center" }] }],
	["KeyF", { image: "letters-numbers", symbols: [{ text: "F", pos: "center" }] }],
	["KeyG", { image: "letters-numbers", symbols: [{ text: "G", pos: "center" }] }],
	["KeyH", { image: "letters-numbers", symbols: [{ text: "H", pos: "center" }] }],
	["KeyJ", { image: "letters-numbers", symbols: [{ text: "J", pos: "center" }] }],
	["KeyK", { image: "letters-numbers", symbols: [{ text: "K", pos: "center" }] }],
	["KeyL", { image: "letters-numbers", symbols: [{ text: "L", pos: "center" }] }],
	["Semicolon", { image: "letters-numbers", symbols: [{ text: ":", pos: "top" }, { text: ";", pos: "bottom" }] }],
	["Quote", { image: "letters-numbers", symbols: [{ text: "\"", pos: "top" }, { text: "'", pos: "bottom" }] }],
	["Enter", { image: "enter-leftshift", symbols: [{ icon: "fa-turn-down", style: "solid", pos: "center" }] }],

	// bottom letter row
	["ShiftLeft", { image: "enter-leftshift", symbols: [{ icon: "fa-angle-double-up", style: "solid", pos: "center" }] }],
	["KeyZ", { image: "letters-numbers", symbols: [{ text: "Z", pos: "center" }] }],
	["KeyX", { image: "letters-numbers", symbols: [{ text: "X", pos: "center" }] }],
	["KeyC", { image: "letters-numbers", symbols: [{ text: "C", pos: "center" }] }],
	["KeyV", { image: "letters-numbers", symbols: [{ text: "V", pos: "center" }] }],
	["KeyB", { image: "letters-numbers", symbols: [{ text: "B", pos: "center" }] }],
	["KeyN", { image: "letters-numbers", symbols: [{ text: "N", pos: "center" }] }],
	["KeyM", { image: "letters-numbers", symbols: [{ text: "M", pos: "center" }] }],
	["Comma", { image: "letters-numbers", symbols: [{ text: "<", pos: "top" }, { text: ",", pos: "bottom" }] }],
	["Period", { image: "letters-numbers", symbols: [{ text: ">", pos: "top" }, { text: ".", pos: "bottom" }] }],
	["Slash", { image: "letters-numbers", symbols: [{ text: "?", pos: "top" }, { text: "/", pos: "bottom" }] }],
	["ShiftRight", { image: "rightshift", symbols: [{ icon: "fa-angle-double-up", style: "solid", pos: "center" }] }],

	// spacebar row
	["ControlLeft", { image: "ctrl-alt-super", symbols: [{ text: "ctrl", pos: "center" }] }],
	["MetaLeft", { image: "ctrl-alt-super", symbols: [{ icon: "fa-linux", style: "brands", pos: "center" }] }],
	["AltLeft", { image: "ctrl-alt-super", symbols: [{ text: "alt", pos: "center" }] }],
	["Space", { image: "space", symbols: [] }],
	["AltRight", { image: "ctrl-alt-super", symbols: [{ text: "alt", pos: "center" }] }],
	["MetaRight", { image: "ctrl-alt-super", symbols: [{ icon: "fa-linux", style: "brands", pos: "center" }] }],
	["ContextMenu", { image: "ctrl-alt-super", symbols: [{ text: "fn", pos: "center" }] }],
	["ControlRight", { image: "ctrl-alt-super", symbols: [{ text: "ctrl", pos: "center" }] }],
]);


// Add rest of the required fields to each entry inside KEYS
//
// to save on space only the fields that differ are declared above
export function setupKeys() {
	for (const data of KEYS.values()) {
		data.errors = { total: 0, mistakes: 0 };
		data.dom = { keyElement: null, glyphElements: {} };
	}
}

// Populate the CHAR_TO_CODE lookup map
// allows finding a key from KEYS from a raw character
export function populateCharLookup() {
	for (const [code, data] of KEYS) {
		data.symbols.forEach(s => {
			if (s.text) CHAR_TO_CODE.set(s.text, code);
		});

	}
	for (let c = 65; c <= 90; c++) {
		const letter = String.fromCharCode(c);
		CHAR_TO_CODE.set(letter, `Key${letter}`);
		CHAR_TO_CODE.set(letter.toLowerCase(), `Key${letter}`);
	}
	for (let d = 0; d <= 9; d++) {
		CHAR_TO_CODE.set(String(d), `Digit${d}`);
	}
	CHAR_TO_CODE.set(" ", "Space");
}

// Create all 5 dom elements needed for each key
//
// Params: type - a string representing a filename for an SVG image (minus the extension)
// Returns: an array of 5 dom elements: 2 img elements and 3 div elements
function createKeyDomElements(type) {
	// create normal and pressed variants of the key
	const [up, down] = ["up", "down"].map((state) => {
		const imgEl = document.createElement("img");
		imgEl.className = `key-img ${state}`;
		const svgFile = state == "down" ? `${type}-pressed.svg` : `${type}.svg`;
		imgEl.src = `/assets/keyboard/${svgFile}`;
		return imgEl;
	});

	// create tinted variants of both images for displaying dynamic colours on error accumulation
	// and "flash" variant for typo animation
	const [tintUp, tintDown, flash] = ["tint up", "tint down", "flash"].map((label) => {
		const el = document.createElement("div");
		el.className = `key-${label}`;
		const svgFile = label === "tint down" ? `${type}-pressed.svg` : `${type}.svg`;
		el.style.setProperty("--key-mask", `url(/assets/keyboard/${svgFile})`);
		return el;
	});
	return [up, down, tintUp, tintDown, flash];
}

// Create the symbol displayed on a key - either text, stacked symbols, or a font-awesome icon
//
// Params: data - the relevant key object pulled from KEYS
// Returns: a div dom element with appropriately styled symbols inside of it
function createKeyLabel(data) {
	const labelWrap = document.createElement("div");
	labelWrap.className = "key-label";
	data.symbols.forEach(entry => {
		const el = document.createElement(entry.icon ? "i" : "span");
		el.className = entry.icon
			? `fa-${entry.style ?? "solid"} ${entry.icon} ${entry.pos}`
			: entry.pos;
		if (!entry.icon) {
			el.textContent = entry.text;
			el.dataset.char = entry.text;
			data.dom.glyphElements[entry.text] = el;
		}
		labelWrap.appendChild(el);
	});

	return labelWrap;
}

// creates the virtual keyboard in the DOM
// from SVG images stored in /resources/static/assets/keyboard
export function createVirtualKeyboard() {
	const board = document.getElementById("keyboard");
	const fragment = document.createDocumentFragment();

	ROW_LAYOUT.forEach(rowCodes => {
		const row = document.createElement("div");
		row.className = "row";

		rowCodes.forEach(code => {
			const data = KEYS.get(code);
			const type = data.image;

			const key = document.createElement("div");
			key.className = "key";
			key.style.width = `calc(${KEY_WIDTH_U[type]} * var(--u))`;
			key.dataset.code = code;

			const domElements = createKeyDomElements(type);
			const labelWrap = createKeyLabel(data);

			key.append(...domElements, labelWrap);
			row.appendChild(key);

			data.dom.keyElement = key;
		});

		fragment.appendChild(row);
	});

	board.appendChild(fragment);

	// listen for the end of the typo animation and remove the class after
	board.addEventListener("animationend", (e) => {
		if (e.target.classList.contains("key-flash")) {
			e.target.closest(".key")?.classList.remove("typo");
		}
	});
}

