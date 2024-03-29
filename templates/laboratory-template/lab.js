// @ts-check
// @ts-expect-error
import { html, render } from "https://unpkg.com/htm/preact/standalone.module.js";

let appLoaded = false;
let paintScheduled = true;
const paintSync = () => {
	if (!appLoaded) return;
	render(html`<${App} />`, document.body);
	paintScheduled = false;
};
const schedulePaint = () => {
	if (paintScheduled) return;
	paintScheduled = true;
	Promise.resolve().then(paintSync);
};

/**
 * The state. Which selection has been made for the inputs that have a choice of outputs
 * @type {Map<string, string | boolean>}
 */
const selections = new Map();

/** @type {typeof selections['set']} */
const setSelection = (name, output) => {
	const match = tweakables.find((v) => v.name === name);
	if (match) {
		if (Array.isArray(match.output) && match.output.includes(/** @type {never} */ (output))) {
			if (selections.get(name) !== output) {
				selections.set(name, output);
				if (appLoaded) {
					location.hash = "";
					schedulePaint();
				}
			}
		}
	}
	return selections;
};


/** @param tweakable {{name: string}} */
const get = (tweakable) => selections.get(tweakable.name);

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
		concern: () => concern(/** @type {T} */(get({name}))),
		default: _default,
		disabled
	};
}

//???TEMPLATE-MARKER-START???
const appTitle = "Laboratory Title";
const appDescriptionHtml = "<p>Laboratory Description</p>";
const appAuthor = "Ada Lovelace";
const appVersion = "1.0";

const concerns = {};

const conditions = {};

const givens = [];
const tweakables = [];
//???TEMPLATE-MARKER-END???

function setToDefaults() {
	for (const { name, default: _default } of tweakables) {
		setSelection(name, _default);
	}
}
setToDefaults();

const design = [...givens, ...tweakables];

// ------------------------------------------------------------------------------------------------

const urlLoadingIssues = (function attemptLoadFromURL() {
	const issues = [];
	try {
		const urlData = location.hash;
		if (!urlData) {
			return [];
		}
		const tweakableKeys = new Map(tweakables.map((t) => [t.name, t]));
		let data;
		try {
			let b64 = urlData.slice(1);
			b64 += Array(((4 - (b64.length % 4)) % 4) + 1).join('=');
			b64 = b64.replace(/\-/g, '+').replace(/\_/g, '/');
			data = JSON.parse(atob(b64));
		} catch (err) {
			// fallback to old url style
			data = JSON.parse(decodeURI(urlData.slice(1)).replace(/%23/g, '#'));
		}
		for (const [key, value] of Object.entries(data)) {
			if (!tweakableKeys.has(key)) {
				issues.push(`Unknown item in url: '${key}'`);
			}
			setSelection(key, value);
			tweakableKeys.delete(key);
		}
		for (const [unusedKey, t] of tweakableKeys) {
			if (t.disabled?.()) continue;
			issues.push(`'${unusedKey}' was not set by the URL`);
		}
	} catch (e) {
		console.error(e);
	}
	return issues;
})();

function shuffle() {
	location.hash = "";
	for (const { name, output } of tweakables) {
		Array.isArray(output) &&
			setSelection(name, output[Math.floor(Math.random() * output.length)]);
	}
	schedulePaint();
}

function App() {
	return html`
		<h1 class="text-center">
			${appTitle} (v${appVersion})
		</h1>
		<p class="text-center">
			by ${appAuthor}
		</p>
		<div class="description-block-outer">
			<div class="description-block-inner">
			${appDescriptionHtml}
			</div>
		</div>
		${urlLoadingIssues.length > 0
			? html`
					<ul class="text-center">
						${urlLoadingIssues.map((issue) => html`<li>${issue}</li>`)}
					</ul>
			  `
			: false}
		<p class="text-center">
			<button onClick=${setToDefaults}>reset</button>
			<button onClick=${shuffle}>shuffle</button>
		</p>
		<table class="center">
			${design.map((c) => {
				const disabled = "disabled" in c ? c.disabled?.() ?? false : false;
				//const currentValue = get(c);
				const concerns = "concern" in c ? c.concern?.() ?? false : false;
				const attrs = disabled ? { class: "disabled", title: disabled } : {};
				return html`
					<tr>
						<td ...${attrs}><pre>${c.input}</pre></td>
						<td><${Selection} ...${c} disabled=${disabled} /></td>
						<td width="500em">
							${disabled
								? html`<details>
										<summary>…</summary>
										${disabled}
								  </details>`
								: concerns
								? concerns
								: ""}
						</td>
					</tr>
				`;
			})}
		</table>
		<div class="center" style=${{ width: "500px" }}>
			<div class="scrollable" style=${{ marginTop: "10px", float: "left" }}>
				<${JSONOutput} />
			</div>
			<div class="scrollable" style=${{ marginTop: "10px", float: "left" }}>
				<${JSONInput} />
			</div>
		</div>
	`;
}

function Selection({ name, output, disabled }) {
	if (Array.isArray(output)) {
		return html`
			<select
				onChange=${(e) => setSelection(name, JSON.parse(e.target.value))}
				disabled=${disabled}
			>
				${output.map(
					(o) =>
						html`<option
							selected=${selections.get(name) === o}
							value=${JSON.stringify(o)}
						>
							${JSON.stringify(o)}
						</option>`
				)}
			</select>
		`;
	}
	return JSON.stringify(output);
}

function getStateAsObject() {
	return Object.fromEntries(
		tweakables.filter(t => !(t.disabled?.() ?? false)).map(t => [t.name, get(t)])
	);
}

function JSONOutput() {
	return html`
		<button onClick=${saveURL}>save as URL</button> or click the JSON to copy that to the clipboard
		<pre onClick=${(e) => copyText(e.target)}>${
			JSON.stringify(getStateAsObject(), undefined, 2)
		}</pre>
	`;
}

function JSONInput() {
	/** @type {HTMLTextAreaElement} */
	let textArea;
	return html`
		<button
			onClick=${() => {
				const input = textArea.value;
				if (input.trim().length === 0) return;
				for (const [key, value] of Object.entries(JSON.parse(input))) {
					setSelection(key, value);
				}
				schedulePaint();
			}}
		>
			Load JSON
		</button>
		<textarea ref=${(el) => (textArea = el)} rows="10" id="input-json"></textarea>
	`;
}

async function saveURL() {
	let encoded = `${btoa(JSON.stringify(getStateAsObject()))}`;
	encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	location.hash = encoded;

	await navigator.clipboard.writeText(location.toString());
	alert("Text copied to clipboard");
}

async function copyText(element) {
	await navigator.clipboard.writeText(element.innerText);
	alert("Text copied to clipboard");
}

appLoaded = true;
paintSync();
