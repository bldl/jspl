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


//???TEMPLATE-MARKER-START???

export const metaData = {
    titel: "",
    descriptionHtml: html``,
    author: "",
    version: "",
}

const concerns = {};

export const givens = [];
export const tweakables = [];

//???TEMPLATE-MARKER-END???