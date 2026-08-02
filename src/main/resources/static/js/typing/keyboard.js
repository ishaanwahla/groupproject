//keyboard.js

import { keyboardState } from "./state.js";

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

// creates the virtual keyboard in the DOM
// from SVG images stored in /resources/static/assets/keyboard
export function createVirtualKeyboard() {
	keyboardState.board = document.getElementById("keyboard");

	ROWS.forEach(rowData => {
		const row = document.createElement("div");
		row.className = "row";

		rowData.forEach(([type, code, label]) => {
			const key = document.createElement("div");
			key.className = "key";
			key.style.width = `calc(${KEY_WIDTH_U[type]} * var(--u))`;
			key.dataset.code = code;

			// tint to show accumulated errors
			const tintUp = document.createElement("div");
			tintUp.className = "key-tint up";
			tintUp.style.setProperty("--key-mask", `url(/assets/keyboard/${type}.svg)`);

			const tintDown = document.createElement("div");
			tintDown.className = "key-tint down";
			tintDown.style.setProperty("--key-mask", `url(/assets/keyboard/${type}-pressed.svg)`);

			// animation showing incorrect keypresses
			const flash = document.createElement("div");
			flash.className = "key-flash";
			flash.style.setProperty("--key-mask", `url(/assets/keyboard/${type}.svg)`);

			// regular SVG
			const up = document.createElement("img");
			up.className = "key-img up";
			up.src = `/assets/keyboard/${type}.svg`;
			up.alt = label;

			// keydown SVG
			const down = document.createElement("img");
			down.className = "key-img down";
			down.src = `/assets/keyboard/${type}-pressed.svg`;
			down.alt = "";


			// create the symbol to place on the key
			const labelWrap = document.createElement("div");
			labelWrap.className = "key-label";

			const entries = LABELS[code] ?? [{ text: label, pos: "center" }];
			entries.forEach(entry => {
				// check if its a font-awesome icon before defaulting to text
				const el = document.createElement(entry.icon ? "i" : "span");
				el.className = entry.icon
					? `fa-${entry.style ?? "solid"} ${entry.icon} ${entry.pos}`
					: entry.pos;
				if (!entry.icon) el.textContent = entry.text;
				labelWrap.appendChild(el);
			});
			key.append(up, down, tintUp, tintDown, flash, labelWrap);

			row.appendChild(key);
			keyboardState.keyRegistry.set(code, key);
		});

		keyboardState.board.appendChild(row);

	});

	// event listener to remove the class for typo animations after they play
	document.getElementById("keyboard").addEventListener("animationend", (e) => {
		if (e.target.classList.contains("key-flash")) {
			e.target.closest(".key")?.classList.remove("typo");
		}
	});
};
