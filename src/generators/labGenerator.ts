import { Group, AndExpression, Concern, Condition, Model, Negation, OrExpression, Proposition, PropositionalExpression, Statement } from '../language/generated/ast.js';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
//import { workspace, Uri } from 'vscode'; // TODO: replace node:fs with workspace.fs
import { CompositeGeneratorNode, toString } from 'langium';
import { integer } from 'vscode-languageserver';
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

const ROOT_FILES_TO_COPY: Array<string> = [
    "README.md",
    "index.html",
    "LICENSE"
];
const RESOURCES_TO_COPY: Array<string> = [
    "favicon.svg",
    "github.png"
];

export function generateLaboratory(model: Model, outputDirectory: string, templateDirectory: string): string {
    const labTemplatePath: string = path.join(templateDirectory, "lab.js");
    
    const outputJavaScript = path.join(outputDirectory, "lab.js");
    const outputResources = path.join(outputDirectory, "res");

    // make sure Resources Folder exists
    if (!existsSync(outputResources))
        mkdirSync(outputResources);

    // Copy static files to output (index.html, LICENSE, README.md, res/favicon.svg, res/github.png)
    ROOT_FILES_TO_COPY.forEach(fileName => {
        copyFileSync(
            path.join(templateDirectory, fileName), 
            path.join(outputDirectory, fileName)
        );
    });
    RESOURCES_TO_COPY.forEach(fileName => {
        copyFileSync(
            path.join(templateDirectory, fileName), 
            path.join(outputResources, fileName)
        );
    });

    const labTemplate = readLabTemplate(labTemplatePath);

    // Clear lab.js file
    writeFileSync(outputJavaScript, "");

    // Create lab.js (by appending to file?)
    // 1. Write Prefix
    appendFileSync(outputJavaScript, labTemplate.prefix);

    // 2. Write Concerns
    const concernsNode = new CompositeGeneratorNode();
    generateConcerns(model.concerns, concernsNode);
    appendFileSync(outputJavaScript, toString(concernsNode))
    
    // 3. Write Infix
    appendFileSync(outputJavaScript, labTemplate.infix);

    // 4. Write Conditions
    const conditionsNode = new CompositeGeneratorNode();
    generateConditions(model.conditions, conditionsNode);
    appendFileSync(outputJavaScript, toString(conditionsNode));

    // 5. Write Givens
    const givensNode = new CompositeGeneratorNode();
    generateGivens(model.propositions, givensNode);
    appendFileSync(outputJavaScript, toString(givensNode));

    // 6. Write Tweakables
    const tweakablesNode = new CompositeGeneratorNode();
    generateTweakables(model.propositions, tweakablesNode);
    appendFileSync(outputJavaScript, toString(tweakablesNode));

    // 7. Write Postfix
    appendFileSync(outputJavaScript, labTemplate.postfix);

    return outputDirectory;
}

function splitByStartAndEndMarker(input: string, markers: {START: string, END: string}): {BEFORE: string, AFTER: string} {
    const splitByStartMarker = input.split(markers.START);

    return {
        BEFORE: splitByStartMarker[0],
        AFTER: splitByStartMarker[1].split(markers.END)[1]
    };
};

function readLabTemplate(labTemplateFile: string): {prefix: string, infix: string, postfix: string} {
    const template: string = readFileSync(labTemplateFile, `utf-8`);

    const splitByConcernsMarkers = splitByStartAndEndMarker(template, LAB_TEMPLATE_CONCERNS_MARKER);
    const splitByPropositionsMarkers = splitByStartAndEndMarker(splitByConcernsMarkers.AFTER, LAB_TEMPLATE_PROPOSITIONS_MARKER);

    return {
        prefix: splitByConcernsMarkers.BEFORE,
        infix: splitByPropositionsMarkers.BEFORE,
        postfix: splitByPropositionsMarkers.AFTER
    };
}

// CONCERNS

function generateConcernHtml(concern: Concern): string {
    return `<details><summary>⚠ ${concern.summary}</summary>
    ${concern.description}
    </details>`;
}

function generateConcerns(concerns: Concern[], node: CompositeGeneratorNode) {
    // Create JS-Object with concerns as members and string/html values (see original lab)
    node.append(`const concerns = {\n`);

    concerns.forEach(concern => {
        node.append(`\t${concern.name}: html\`${generateConcernHtml(concern)}\`,\n`);
    });

    node.append(`};\n`);
}

// CONDITIONS

function generateConditions(conditions: Condition[], node: CompositeGeneratorNode) {
    node.append(`const conditions = {\n`);

    conditions.forEach(condition => {
        node.append(`\t${condition.name}: () => {\n`);
        node.append(`\t\treturn ${extractJSCondition.fromExpression(condition.condition.expression)};\n`);
        node.append(`\t},\n`);
    });

    node.append(`};\n`);
}

// PROPOSITIONS

function isGiven(proposition: Proposition) {
    return proposition.valueClauses.length == 1;
}

function extractValueAsString(value: string | boolean): string {
    return (typeof value) === "string" ? `"${value}"`: toString(value);
}

function generateGivens(propositions: Proposition[], node: CompositeGeneratorNode) {
    node.append(`const givens = [\n`);

    propositions.filter(isGiven).forEach(given => {
        let value = given.valueClauses[0].value;
        node.append(`\t{ input: \`${given.expression}\`, output: ${extractValueAsString(value)} },\n`);
    });

    node.append(`];\n`);
}

const extractJSCondition = {
    fromOrExpression: function (expression: OrExpression): string {
        return `${extractJSCondition.fromExpression(expression.left)} || ${extractJSCondition.fromExpression(expression.right)}`;
    },
    fromAndExpression: function (expression: AndExpression): string {
        return `${extractJSCondition.fromExpression(expression.left)} && ${extractJSCondition.fromExpression(expression.right)}`;
    },
    fromNegation: function (expression: Negation): string {
        return `! ${extractJSCondition.fromExpression(expression.inner)}`;
    },
    fromGroup: function (expression: Group): string {
        return `(${extractJSCondition.fromExpression(expression.inner)})`;
    },
    fromStatement: function (expression: Statement): string {
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
    fromExpression: function (expression: PropositionalExpression): string {
        switch (expression.$type) {
            case 'OrExpression': 
                return extractJSCondition.fromOrExpression(expression as OrExpression);
            case 'AndExpression': 
                return extractJSCondition.fromAndExpression(expression as AndExpression);
            case 'Negation': 
                return extractJSCondition.fromNegation(expression as Negation);
            case 'Group':
                return extractJSCondition.fromGroup(expression as Group);
            case 'Statement': 
                return extractJSCondition.fromStatement(expression as Statement);
        }
    }
};

function generateConcernFunction(proposition: Proposition, node: CompositeGeneratorNode, baseIndent: string) {
    const indent = (level: integer) => baseIndent + "\t".repeat(level);

    node.append(`(self) => {\n`);
    node.append(indent(1) + `let result = [];\n`)
    proposition.valueClauses.forEach(clause => {
        node.append(indent(1) + `if (self === ${extractValueAsString(clause.value)}) {\n`);
        clause.raises.forEach(raise => {
            if (raise.condition === undefined) {
                node.append(indent(2) + `result.push(concerns.${raise.concern.ref?.name});\n`);
            } else {
                node.append(indent(2) + `if (${extractJSCondition.fromExpression(raise.condition.expression)}) {\n`);
                node.append(indent(3) + `result.push(concerns.${raise.concern.ref?.name});\n`);
                node.append(indent(2) + "}\n");
            }
        })
        node.append(indent(1) + "}\n");
    });

    node.append(indent(1) + `return result;\n`);
    node.append(`${indent(0)}}`);
}

function generateDisableFunction(proposition: Proposition, node: CompositeGeneratorNode, baseIndent: string) {
    const indent = (level: integer) => baseIndent + "\t".repeat(level);
    if(proposition.disable === undefined) {
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

function generateTweakables(propositions: Proposition[], node: CompositeGeneratorNode) {
    const tweakables = propositions.filter(proposition => !isGiven(proposition));
    const reference = (proposition: Proposition) => {return `tweakablesContainer.${proposition.name}`};

    node.append(`const tweakablesContainer = {\n`);
    tweakables.forEach(tweakable => {
        node.append(`\t${tweakable.name}: tweakable({\n`);
        {
            let defaultValue = tweakable.valueClauses.filter(clause => {return clause.default;})[0].value;
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
        node.append(`\t}),\n`)
    });
    node.append(`};\n`);

    node.append(`const tweakables = [\n`);

    tweakables.forEach(tweakable => {
        node.append(`\t${reference(tweakable)},\n`);
    });

    node.append(`];\n`);
}