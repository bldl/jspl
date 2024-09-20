import { html } from "https://unpkg.com/htm/preact/standalone.module.js";

/**
 * # Tweakables
 * name: a unique string to identify the tweakable (used in searches)
 * input: a JS snippet
 * output: a string if this is 'given', or an Array of design options
 * disabled: a non-pure function that returns a string if this options is not currently available
 * concern: a non-pure function that returns a string if there is a concern with the design
 *
 * @template {string|boolean} T
 * @param t {{name: string, input: string, output: readonly T[], concern : ((self:T) => any), default: T, disabled?: Function }}
 */
function tweakable({name, input, output, concern, default: _default, disabled}) {
	return {
		name,
		input,
		output,
		concern: (get) => concern(get(name), get),
		default: _default,
		disabled
	};
}


export const metaData = {
	title: "Laboratory Title",
	descriptionHtml: html`<p>Laboratory description</p>`,
	author: undefined,
	version: undefined,
	scipUrl: "http://localhost:5000/optimize"
};
export const concerns = {
	concerning: html`<details><summary>⚠ a != b</summary>
    <p>We need a to be equal to b.</p>

    </details>`,
};
const conditions = {
};
export const givens = [
];
export const tweakables = [
	tweakable({
		name: `first`,
		input: `a == 0`,
		output: [true, false],
		default: true,
		concern: (self, get) => {
			let result = [];
			if (self === true) {
				if (get('second') === false) {
					result.push(concerns.concerning);
				}
			}
			if (self === false) {
				if (get('second') === true) {
					result.push(concerns.concerning);
				}
			}
			return result;
		},
		disabled: (get) => {
			return false;
		},
	}),
	tweakable({
		name: `second`,
		input: `b == 0`,
		output: [true, false],
		default: false,
		concern: (self, get) => {
			let result = [];
			if (self === true) {
				if (get('first') === false) {
					result.push(concerns.concerning);
				}
			}
			if (self === false) {
				if (get('first') === true) {
					result.push(concerns.concerning);
				}
			}
			return result;
		},
		disabled: (get) => {
			return false;
		},
	}),
];
export const raiseConditions = {
	concerning: {"type":"or","left":{"type":"and","left":{"type":"statement","proposition":"first","value":true},"right":{"type":"statement","proposition":"second","value":false}},"right":{"type":"or","left":{"type":"and","left":{"type":"statement","proposition":"first","value":false},"right":{"type":"statement","proposition":"second","value":true}},"right":{"type":"or","left":{"type":"and","left":{"type":"statement","proposition":"second","value":true},"right":{"type":"statement","proposition":"first","value":false}},"right":{"type":"and","left":{"type":"statement","proposition":"second","value":false},"right":{"type":"statement","proposition":"first","value":true}}}}},
};

