//keyboard.js
//
// Initializes the virtual keyboard in the DOM.
// keys in each row are set up as follows:
// [type, code, label]:
//		type refers to the SVG graphic name,
//		code is the lookup code for fetching the key element from the keyRegistry
//		label is just a shorter name meant for debugging purposes (not reflected anywhere visually)

import { keyboardState } from "./state.js";

const ROWS = [
	[
		["letters-numbers", "Escape", "esc"],
		["letters-numbers", "Digit1", "1"], ["letters-numbers", "Digit2", "2"],
		["letters-numbers", "Digit3", "3"], ["letters-numbers", "Digit4", "4"],
		["letters-numbers", "Digit5", "5"], ["letters-numbers", "Digit6", "6"],
		["letters-numbers", "Digit7", "7"], ["letters-numbers", "Digit8", "8"],
		["letters-numbers", "Digit9", "9"], ["letters-numbers", "Digit0", "0"],
		["letters-numbers", "Minus", "-"], ["letters-numbers", "Equal", "="],
		["backspace", "Backspace", "backspace"],
	],
	[
		["tab-pipe", "Tab", "tab"],
		["letters-numbers", "KeyQ", "Q"], ["letters-numbers", "KeyW", "W"],
		["letters-numbers", "KeyE", "E"], ["letters-numbers", "KeyR", "R"],
		["letters-numbers", "KeyT", "T"], ["letters-numbers", "KeyY", "Y"],
		["letters-numbers", "KeyU", "U"], ["letters-numbers", "KeyI", "I"],
		["letters-numbers", "KeyO", "O"], ["letters-numbers", "KeyP", "P"],
		["letters-numbers", "BracketLeft", "["], ["letters-numbers", "BracketRight", "]"],
		["tab-pipe", "Backslash", "\\"],
	],
	[
		["caps", "CapsLock", "caps"],
		["letters-numbers", "KeyA", "A"], ["letters-numbers", "KeyS", "S"],
		["letters-numbers", "KeyD", "D"], ["letters-numbers", "KeyF", "F"],
		["letters-numbers", "KeyG", "G"], ["letters-numbers", "KeyH", "H"],
		["letters-numbers", "KeyJ", "J"], ["letters-numbers", "KeyK", "K"],
		["letters-numbers", "KeyL", "L"], ["letters-numbers", "Semicolon", ";"],
		["letters-numbers", "Quote", "'"],
		["enter-leftshift", "Enter", "enter"],
	],
	[
		["enter-leftshift", "ShiftLeft", "shift"],
		["letters-numbers", "KeyZ", "Z"], ["letters-numbers", "KeyX", "X"],
		["letters-numbers", "KeyC", "C"], ["letters-numbers", "KeyV", "V"],
		["letters-numbers", "KeyB", "B"], ["letters-numbers", "KeyN", "N"],
		["letters-numbers", "KeyM", "M"], ["letters-numbers", "Comma", ","],
		["letters-numbers", "Period", "."], ["letters-numbers", "Slash", "/"],
		["rightshift", "ShiftRight", "shift"],
	],
	[
		["ctrl-alt-super", "ControlLeft", "ctrl"],
		["ctrl-alt-super", "MetaLeft", "super"],
		["ctrl-alt-super", "AltLeft", "alt"],
		["space", "Space", "space"],
		["ctrl-alt-super", "AltRight", "alt"],
		["ctrl-alt-super", "MetaRight", "super"],
		["ctrl-alt-super", "ContextMenu", "fn"],
		["ctrl-alt-super", "ControlRight", "ctrl"],
	],
];

// Used to add symbols on top of the key
// text is a string literal
// icon is a font-awesome icon
const LABELS = {
	Digit1: [{ text: "!", pos: "top" }, { text: "1", pos: "bottom" }],
	Digit2: [{ text: "@", pos: "top" }, { text: "2", pos: "bottom" }],
	Digit3: [{ text: "#", pos: "top" }, { text: "3", pos: "bottom" }],
	Digit4: [{ text: "$", pos: "top" }, { text: "4", pos: "bottom" }],
	Digit5: [{ text: "%", pos: "top" }, { text: "5", pos: "bottom" }],
	Digit6: [{ text: "^", pos: "top" }, { text: "6", pos: "bottom" }],
	Digit7: [{ text: "&", pos: "top" }, { text: "7", pos: "bottom" }],
	Digit8: [{ text: "*", pos: "top" }, { text: "8", pos: "bottom" }],
	Digit9: [{ text: "(", pos: "top" }, { text: "9", pos: "bottom" }],
	Digit0: [{ text: ")", pos: "top" }, { text: "0", pos: "bottom" }],
	Minus: [{ text: "_", pos: "top" }, { text: "-", pos: "bottom" }],
	Equal: [{ text: "+", pos: "top" }, { text: "=", pos: "bottom" }],
	BracketLeft: [{ text: "{", pos: "top" }, { text: "[", pos: "bottom" }],
	BracketRight: [{ text: "}", pos: "top" }, { text: "]", pos: "bottom" }],
	Backslash: [{ text: "|", pos: "top" }, { text: "\\", pos: "bottom" }],
	Semicolon: [{ text: ":", pos: "top" }, { text: ";", pos: "bottom" }],
	Quote: [{ text: "\"", pos: "top" }, { text: "'", pos: "bottom" }],
	Comma: [{ text: "<", pos: "top" }, { text: ",", pos: "bottom" }],
	Period: [{ text: ">", pos: "top" }, { text: ".", pos: "bottom" }],
	Slash: [{ text: "?", pos: "top" }, { text: "/", pos: "bottom" }],
	Space: [{ text: "", pos: "bottom" }],

	Tab: [{ icon: "fa-arrow-right-arrow-left", pos: "center" }],
	Enter: [{ text: "enter", pos: "center" }],
	Backspace: [{ icon: "fa-arrow-left-long", pos: "center" }],
	ShiftLeft: [{ icon: "fa-up-long", pos: "center" }],
	ShiftRight: [{ icon: "fa-up-long", pos: "center" }],
	MetaLeft: [{ icon: "fa-linux", pos: "center", style: "brands" }],
	MetaRight: [{ icon: "fa-linux", pos: "center", style: "brands" }],
};

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
			key.append(up, down, labelWrap);

			row.appendChild(key);
			keyboardState.keyRegistry.set(code, key);
		});

		keyboardState.board.appendChild(row);
	});
};
