//text.js
//
// converts raw fetched text into typed "units" for the app to compare keystrokes against
//
// most typed characters map to a single required keystroke, however some Project Gutenberg
// characters map to specific UTF-8 symbols that either don't exist on a keyboard (oxford commas, fancy quotes),
// or are mapped to multiple keystrokes (ellipsis, em-dashes)

const SPECIAL_UNITS = {
	"\u2018": { display: "\u2018", keys: ["'"] },        // left single quotation mark
	"\u2019": { display: "\u2019", keys: ["'"] },        // right single quotation mark / apostrophe
	"\u201C": { display: "\u201C", keys: ['"'] },        // left double quotation mark
	"\u201D": { display: "\u201D", keys: ['"'] },        // right double quotation mark
	"\u2014": { display: "\u2014", keys: ["-", "-"] },   // em dash
	"\u2013": { display: "\u2013", keys: ["-"] },        // en dash
	"\u2026": { display: "\u2026", keys: [".", ".", "."] }, // horizontal ellipsis
	"\u00A0": { display: "\u00A0", keys: [" "] },        // non-breaking space
};
Object.freeze(SPECIAL_UNITS);

// Params: rawText is an array of individual characters, as returned in a
// fetched chunk's "text" field
// Returns: an array of typing units in format { display, keys } one per character,
// where "keys" is the sequence of keystrokes required to complete it.
// plain characters will fall through to a single-key unit.
export function textToTypingUnits(rawText) {
	return rawText.map(char => SPECIAL_UNITS[char] ?? { display: char, keys: [char] });
}
