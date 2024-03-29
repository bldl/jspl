import { CompositeGeneratorNode } from "langium";
import { integer } from "vscode-languageserver";
import { Proposition } from "../../language/generated/ast.js";
import { extractJSCondition } from "./util.js";
import { extractValueAsString } from "../../util/modelUtil.js";

function isGiven(proposition: Proposition) {
    return proposition.valueClauses.length == 1;
}

export function generateGivens(propositions: Proposition[], node: CompositeGeneratorNode) {
    node.append(`const givens = [\n`);

    propositions.filter(isGiven).forEach(given => {
        let value = given.valueClauses[0].value;
        node.append(`\t{ input: \`${given.expression}\`, output: ${extractValueAsString(value)} },\n`);
    });

    node.append(`];\n`);
}

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

export function generateTweakables(propositions: Proposition[], node: CompositeGeneratorNode) {
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