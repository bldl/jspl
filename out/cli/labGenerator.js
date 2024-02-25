import * as fs from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';
import path from 'node:path';
//const TEMPLATES_DIRECTORY: string = "./templates/laboratory-template";
const LAB_TEMPLATE_CONCERNS_MARKER = {
    START: "//???TEMPLATE-MARKER-CONCERNS-START???",
    END: "//???TEMPLATE-MARKER-CONCERNS-END???"
};
const LAB_TEMPLATE_PROPOSITIONS_MARKER = {
    START: "//???TEMPLATE-MARKER-PROPOSITIONS-START???",
    END: "//???TEMPLATE-MARKER-PROPOSITIONS-END???"
};
const ROOT_FILES_TO_COPY = [
    "README.md",
    "index.html",
    "LICENSE"
];
const RESOURCES_TO_COPY = [
    "favicon.svg",
    "github.png"
];
export function generateLaboratory(model, outputDirectory, templateDirectory) {
    const labTemplatePath = path.join(templateDirectory, "lab.js");
    const outputJavaScript = path.join(outputDirectory, "lab.js");
    const outputResources = path.join(outputDirectory, "res");
    // make sure Resources Folder exists
    if (!fs.existsSync(outputResources))
        fs.mkdirSync(outputResources);
    // Copy static files to output (index.html, LICENSE, README.md, res/favicon.svg, res/github.png)
    ROOT_FILES_TO_COPY.forEach(fileName => {
        fs.copyFileSync(path.join(templateDirectory, fileName), path.join(outputDirectory, fileName));
    });
    RESOURCES_TO_COPY.forEach(fileName => {
        fs.copyFileSync(path.join(templateDirectory, fileName), path.join(outputResources, fileName));
    });
    const labTemplate = readLabTemplate(labTemplatePath);
    // Clear lab.js file
    fs.writeFileSync(outputJavaScript, "");
    // Create lab.js (by appending to file?)
    // 1. Write Prefix
    fs.appendFileSync(outputJavaScript, labTemplate.prefix);
    // 2. Write Concerns
    const concernsNode = new CompositeGeneratorNode();
    generateConcerns(model.concerns, concernsNode);
    fs.appendFileSync(outputJavaScript, toString(concernsNode));
    // 3. Write Infix
    fs.appendFileSync(outputJavaScript, labTemplate.infix);
    // 4. Write Conditions
    const conditionsNode = new CompositeGeneratorNode();
    generateConditions(model.conditions, conditionsNode);
    fs.appendFileSync(outputJavaScript, toString(conditionsNode));
    // 5. Write Givens
    const givensNode = new CompositeGeneratorNode();
    generateGivens(model.propositions, givensNode);
    fs.appendFileSync(outputJavaScript, toString(givensNode));
    // 6. Write Tweakables
    const tweakablesNode = new CompositeGeneratorNode();
    generateTweakables(model.propositions, tweakablesNode);
    fs.appendFileSync(outputJavaScript, toString(tweakablesNode));
    // 7. Write Postfix
    fs.appendFileSync(outputJavaScript, labTemplate.postfix);
    return outputDirectory;
}
function splitByStartAndEndMarker(input, markers) {
    const splitByStartMarker = input.split(markers.START);
    return {
        BEFORE: splitByStartMarker[0],
        AFTER: splitByStartMarker[1].split(markers.END)[1]
    };
}
;
function readLabTemplate(labTemplateFile) {
    const template = fs.readFileSync(labTemplateFile, `utf-8`);
    const splitByConcernsMarkers = splitByStartAndEndMarker(template, LAB_TEMPLATE_CONCERNS_MARKER);
    const splitByPropositionsMarkers = splitByStartAndEndMarker(splitByConcernsMarkers.AFTER, LAB_TEMPLATE_PROPOSITIONS_MARKER);
    return {
        prefix: splitByConcernsMarkers.BEFORE,
        infix: splitByPropositionsMarkers.BEFORE,
        postfix: splitByPropositionsMarkers.AFTER
    };
}
// CONCERNS
function generateConcernHtml(concern) {
    return `<details><summary>⚠ ${concern.summary}</summary>
    ${concern.description}
    </details>`;
}
function generateConcerns(concerns, node) {
    // Create JS-Object with concerns as members and string/html values (see original lab)
    node.append(`const concerns = {\n`);
    concerns.forEach(concern => {
        node.append(`\t${concern.name}: html\`${generateConcernHtml(concern)}\`,\n`);
    });
    node.append(`};\n`);
}
// CONDITIONS
function generateConditions(conditions, node) {
    node.append(`const conditions = {\n`);
    conditions.forEach(condition => {
        node.append(`\t${condition.name}: () => {\n`);
        node.append(`\t\treturn ${extractJSCondition.fromExpression(condition.condition.expression)};\n`); // TODO:
        node.append(`\t},\n`);
    });
    node.append(`};\n`);
}
// PROPOSITIONS
function isGiven(proposition) {
    return proposition.valueClauses.length == 1;
}
function extractValueAsString(value) {
    return (typeof value) === "string" ? `"${value}"` : toString(value);
}
function generateGivens(propositions, node) {
    node.append(`const givens = [\n`);
    propositions.filter(isGiven).forEach(given => {
        let value = given.valueClauses[0].value;
        node.append(`\t{ input: \`${given.expression}\`, output: ${extractValueAsString(value)} },\n`);
    });
    node.append(`];\n`);
}
const extractJSCondition = {
    fromOrExpression: function (expression) {
        return `${extractJSCondition.fromExpression(expression.left)} || ${extractJSCondition.fromExpression(expression.right)}`;
    },
    fromAndExpression: function (expression) {
        return `${extractJSCondition.fromExpression(expression.left)} && ${extractJSCondition.fromExpression(expression.right)}`;
    },
    fromNegation: function (expression) {
        return `! ${extractJSCondition.fromExpression(expression.inner)}`;
    },
    fromGroup: function (expression) {
        return `(${extractJSCondition.fromExpression(expression.inner)})`;
    },
    fromStatement: function (expression) {
        const reference = expression.reference.ref;
        if (reference == undefined)
            return ""; // This should never occur....
        const equalTo = `${expression.negation ? "!" : "="}== ${extractValueAsString(expression.value)}`;
        switch (reference.$type) {
            case 'Condition':
                return `conditions.${reference.name}() ${equalTo}`;
            case 'Proposition':
                return `get(tweakablesContainer.${reference.name}) ${equalTo}`;
        }
    },
    fromExpression: function (expression) {
        switch (expression.$type) {
            case 'OrExpression':
                return extractJSCondition.fromOrExpression(expression);
            case 'AndExpression':
                return extractJSCondition.fromAndExpression(expression);
            case 'Negation':
                return extractJSCondition.fromNegation(expression);
            case 'Group':
                return extractJSCondition.fromGroup(expression);
            case 'Statement':
                return extractJSCondition.fromStatement(expression);
        }
    }
};
function generateConcernFunction(proposition, node, baseIndent) {
    const indent = (level) => baseIndent + "\t".repeat(level);
    // TODO: make this return a list of concerns that all get listed, instead of the first found
    node.append(`(self) => {\n`);
    node.append(indent(1) + `let result = [];\n`);
    proposition.valueClauses.forEach(clause => {
        node.append(indent(1) + `if (self === ${extractValueAsString(clause.value)}) {\n`);
        clause.raises.forEach(raise => {
            var _a, _b;
            if (raise.condition === undefined) {
                node.append(indent(2) + `result.push(concerns.${(_a = raise.concern.ref) === null || _a === void 0 ? void 0 : _a.name});\n`); // TODO:
            }
            else {
                node.append(indent(2) + `if (${extractJSCondition.fromExpression(raise.condition.expression)}) {\n`);
                node.append(indent(3) + `result.push(concerns.${(_b = raise.concern.ref) === null || _b === void 0 ? void 0 : _b.name});\n`); // TODO:
                node.append(indent(2) + "}\n");
            }
        });
        node.append(indent(1) + "}\n");
    });
    node.append(indent(1) + `return result;\n`);
    node.append(`${indent(0)}}`);
}
function generateDisableFunction(proposition, node, baseIndent) {
    const indent = (level) => baseIndent + "\t".repeat(level);
    if (proposition.disable === undefined) {
        node.append(indent(1) + "return false;\n");
        return;
    }
    proposition.disable.statements.forEach(statement => {
        node.append(indent(1) + `if (${extractJSCondition.fromExpression(statement.condition.expression)}) {\n`);
        node.append(indent(2) + `return "${statement.message}"\n`);
        node.append(indent(1) + `}\n`);
    });
    node.append(indent(1) + "return false;\n");
}
function generateTweakables(propositions, node) {
    const tweakables = propositions.filter(proposition => !isGiven(proposition));
    const reference = (proposition) => { return `tweakablesContainer.${proposition.name}`; };
    node.append(`const tweakablesContainer = {\n`);
    tweakables.forEach(tweakable => {
        node.append(`\t${tweakable.name}: tweakable({\n`);
        {
            let defaultValue = tweakable.valueClauses.filter(clause => { return clause.default; })[0].value;
            let outputListAsString = tweakable.valueClauses.map(clause => extractValueAsString(clause.value)).join(", ");
            node.append(`\t\tname: \`${tweakable.name}\`,\n`);
            node.append(`\t\tinput: \`${tweakable.expression}\`,\n`);
            node.append(`\t\toutput: [${outputListAsString}],\n`);
            node.append(`\t\tdefault: ${extractValueAsString(defaultValue)},\n`);
            node.append(`\t\tconcern: `);
            generateConcernFunction(tweakable, node, "\t\t");
            node.append(`,\n`);
            node.append(`\t\tdisabled: () => {\n`);
            generateDisableFunction(tweakable, node, "\t\t");
            node.append(`\t\t},\n`);
        }
        node.append(`\t}),\n`);
    });
    node.append(`};\n`);
    node.append(`const tweakables = [\n`);
    tweakables.forEach(tweakable => {
        node.append(`\t${reference(tweakable)},\n`);
    });
    node.append(`];\n`);
}
//# sourceMappingURL=labGenerator.js.map