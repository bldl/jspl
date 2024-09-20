// @ts-check
// @ts-expect-error
import { html, render } from "https://unpkg.com/htm/preact/standalone.module.js";
import { metaData, givens, tweakables, concerns, raiseConditions } from "./data.js";
import { constructOptimizerInput } from "./optimization.js";


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


/** @param tweakableName {string} */
const get = (tweakableName) => selections.get(tweakableName);

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

function openPage(pageName) {
	// Hide all elements with class="tabcontent" by default */
	var i, tabcontent;
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		// @ts-ignore
		tabcontent[i].style.display = "none";
	}

	// Show the specific tab content
	let selectedPage = document.getElementById(pageName);
	if (selectedPage !== null) {
		selectedPage.style.display = "block";
	}
}

function App() {
	return html`
		<h1 class="text-center">
			${metaData.title} ${metaData.version == undefined ? "" : `(v${metaData.version})`} [Optimize]
		</h1>
		${
			metaData.author == undefined ? "" : html`
				<p class="text-center">
					by ${metaData.author}
				</p>
			`
		}
		<div class="description-block-outer">
			<div class="description-block-inner">
			${metaData.descriptionHtml}
			</div>
		</div>
		${urlLoadingIssues.length > 0
			? html`
					<ul class="text-center">
						${urlLoadingIssues.map((issue) => html`<li>${issue}</li>`)}
					</ul>
			  `
			: false}
		<button class="tablink" onclick=${()=>openPage('Experiment')}>Experiment</button>
		<button class="tablink" onclick=${()=>openPage('Weights')}>Weights</button>
		<button class="tablink" onclick=${()=>openPage('Optimize')}>Optimize</button>
		<button class="tablink" onclick=${()=>openPage('Debug')} id="defaultOpen">Debug</button>
		
		<div id="Experiment" class="tabcontent">
			${experimentContent()}
		</div>
		<div id="Weights" class="tabcontent">
			${weightsContent()}
		</div>
		<div id="Optimize" class="tabcontent">
			<h3>Optimize</h3>
		</div>
		<div id="Debug" class="tabcontent">
			${debugContent()}
		</div>
	`;
	// https://www.w3schools.com/howto/howto_js_full_page_tabs.asp
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
		tweakables.filter(t => !(t.disabled?.(get) ?? false)).map(t => [t.name, get(t.name)])
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

/**
 * The state of currently selected weights for every concern
 * @type {Map<string, number>}
 */
const selectedWeights = new Map();
function setDefaultWeights() {
	Object.keys(concerns).forEach((concernName) => {
		selectedWeights.set(concernName, 1.0);
	});
}
setDefaultWeights();

function experimentContent() {
	return html`
		<h3>Experiment</h3>
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
				const disabled = "disabled" in c ? c.disabled?.(get) ?? false : false;
				//const currentValue = get(c);
				const concerns = "concern" in c ? c.concern?.(get) ?? false : false;
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
	`
}

function weightsContent() {	
    return html`
        <h3>Weights</h3>
        <table class="center">
            ${Object.keys(raiseConditions).map((concernName) => {
                return html`
                    <tr>
                        <td>
						 	<input type="number" value=1 onchange=${() => weightChanged(concernName)} id="${concernName}_weight"/>
                        </td>
                        <td width=500em>${concerns[concernName]}</td>
                    </tr>
                `
            })}
        </table>
    `
}

function weightChanged(concernName) {
	let selector = document.getElementById(concernName + "_weight");
	if (selector === null) return;

	// @ts-ignore
	let newValue = parseFloat(selector.value);
	selectedWeights.set(concernName, newValue);
}

function debugContent() {

	return html`
		<h3>Debug</h3>
		<details>
			<summary>Raise Conditions</summary>
			<div>
				<table class="center">
				<tr><td>A</td><td>B</td></tr>
					${Object.keys(raiseConditions).map((concernName) => {
						return html`
							<tr>
								<td>${concernName}</td>
								<td>${toStringRaiseCondition(raiseConditions[concernName])}</td>
							</tr>
						`
					})}
				</table>
			</div>
		</details>
		<details open="true">
			<summary>Optimizer Test</summary>
			<button onclick=${() => optimizeAction()}>Optimize</button>
			<div style="padding-left: 2em">
				<details>
					<summary>Objective Function</summary>
					<div class="center" id="debugObjectiveFunction"></div>
				</details>
				<details>
					<summary>Variables</summary>
					<div class="center" id="debugVariables"></div>
				</details>
				<details>
					<summary>Constraints</summary>
					<div class="center" id="debugConstraints"></div>
				</details>
				<details>
					<summary>Reverse Variable Map</summary>
					<div class="center" id="debugReverseVariableMap"></div>
				</details>
			</div>
			<div class="center" id="debugOptimizerResult"></div>
		</details>
	`;
}

function optimizeAction() {
	let outputElement = document.getElementById("debugOptimizerResult");

	// @ts-ignore
	outputElement.innerHTML = "Computing...";
	
	let reversibleInput = constructOptimizerInput(
		tweakables,
		raiseConditions,
		selectedWeights
	);

	// TODO: remove debug
	{
		let debugObjective = document.getElementById("debugObjectiveFunction");
		let debugVar = document.getElementById("debugVariables");
		let debugConstraints = document.getElementById("debugConstraints");
		let debugReverse = document.getElementById("debugReverseVariableMap");

		console.log(reversibleInput);

		// @ts-ignore
		debugObjective.innerHTML = `
			<p>${reversibleInput.optimizerInput.objective}</p>
		`;

		// @ts-ignore
		debugVar.innerHTML = `
			<table class="center">
			${reversibleInput.optimizerInput.variables.map((variableName) => {
				return `<tr><td>${variableName}</td></tr>`;
			}).join("")}
			</table>
		`;

		// @ts-ignore
		debugConstraints.innerHTML = `
			<table class="center">
			${reversibleInput.optimizerInput.constraints.map((constraint) => {
				return `<tr><td>${constraint}</td></tr>`;
			}).join("")}
			</table>
		`;
		
		// @ts-ignore
		debugReverse.innerHTML = `
			<h4>Concerns</h4>
			<table class="center">
			${Array.from(reversibleInput.variableMeaningMap.concerns.keys()).map((key) => {
				return `
					<tr>
						<td><b>${key}</b></td>
						<td>${reversibleInput.variableMeaningMap.concerns.get(key)}</td>
					</tr>
				`;
			}).join("")}
			</table>
			<h4>Propositions</h4>
			<table class="center">
			${Array.from(reversibleInput.variableMeaningMap.propositions.keys()).map((key) => {
				return `<tr><td><b>${key}</b></td>` + Object.keys(reversibleInput.variableMeaningMap.propositions.get(key)).map((value) => {
					return `<td><b>${value}</b></td><td>${reversibleInput.variableMeaningMap.propositions.get(key)[value]}</td>`;
				}).join("</tr><tr><td></td>") + "</tr></tr>";
			}).join("")}
			</table>
		`;
	}

	return;

	fetch(`${metaData.scipUrl}?input=${encodeApiInput(reversibleInput.optimizerInput)}`)
	.then(response => response.json())
	.then(data => {
		// @ts-ignore
		outputElement.innerHTML = "YAY";
		switch (data.status) {
			case "error":
				throw new Error("An Error occurred while solving the request.");
			case "success":
				showOptimizerResults(JSON.parse(data.result));
				break;
		}
	})
	.catch(error => {
		// @ts-ignore
		outputElement.innerHTML = "ERROR";
		console.log(error)
	})
}

function showOptimizerResults(result) {
	let outputElement = document.getElementById("optimizerResult");

	let representation = `
		<table class="center">
			<tr>	
				<td><b>Variable</b></td>
				<td><b>Value</b></td>
			</tr>
			${Object.keys(result).map((variable) => {
					return `
						<tr>
							<td>${variable}</td>
							<td>${result[variable]}</td>
						</tr>	
					`
				}).join("")
			}
		</table>
	`;
	console.log(representation);
	// @ts-ignore
	outputElement.innerHTML = representation;
}

function encodeApiInput(jsonObject) {
	// TODO: base 64 encode
	//return btoa(JSON.stringify(jsonObject))
	return encodeURIComponent(JSON.stringify(jsonObject));
}

function toStringRaiseCondition(condition) {
	switch (condition.type) {
		case "statement":
			return `${condition.proposition} is ${condition.value}`;
		case "not":
			return `not (${toStringRaiseCondition(condition.inner)})`;
		case "or":
			return `(${toStringRaiseCondition(condition.left)}) or (${toStringRaiseCondition(condition.right)})`;
		case "and":
			return `(${toStringRaiseCondition(condition.left)}) and (${toStringRaiseCondition(condition.right)})`;
	}
}

appLoaded = true;
paintSync();

// Get the element with id="defaultOpen" and click on it
let defaulPageButton = document.getElementById("defaultOpen");
if (defaulPageButton !== null) {
	defaulPageButton.click();
}

