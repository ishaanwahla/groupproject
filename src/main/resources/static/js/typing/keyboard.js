//keyboard.js
//
// Initializes the virtual keyboard in the DOM.
// keys in each row are set up as follows:
// [type, code, label]:
//		type refers to the SVG graphic name,
//		code is the lookup code for fetching the key element from the keyRegistry
//		label is just a shorter name meant for debugging purposes (not reflected anywhere visually)

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
		["ctrl-alt-super", "ContextMenu", "menu"],
		["ctrl-alt-super", "ControlRight", "ctrl"],
	],
];


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
