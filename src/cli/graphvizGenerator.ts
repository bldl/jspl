import { AndExpression, Model, OrExpression, Proposition, PropositionalExpression, Referenceable, Statement, WhenCondition } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';

const GRAPHVIZ_COLORS = {
    red: "\"#9d0208\"",
    yellow: "\"#ffba08\""
}

const GRAPHVIZ_PREFIX: string = "digraph G {\n";
const GRAPHVIZ_POSTFIX: string = "}\n";
const GRAPHVIZ_PROPOSITIONS_NODE_STYLE: string = "shape=oval, color=black";
const GRAPHVIZ_PROPOSITIONS_DISABLE_EDGE_STYLE: string = `labelfontcolor=${GRAPHVIZ_COLORS.red}, color=${GRAPHVIZ_COLORS.red}`;
const GRAPHVIZ_PROPOSITIONS_RAISE_EDGE_STYLE: string = `labelfontcolor=${GRAPHVIZ_COLORS.yellow}, color=${GRAPHVIZ_COLORS.yellow}`;

export function generateGraphviz(model: Model, filePath: string, destination: string): string {
    const generatedFilePath = destination;

    const propositionsNode = new CompositeGeneratorNode();
    
    graphvizPropositions(model.propositions, propositionsNode);

    fs.writeFileSync(generatedFilePath, GRAPHVIZ_PREFIX);
    fs.appendFileSync(generatedFilePath, toString(propositionsNode));
    fs.appendFileSync(generatedFilePath, GRAPHVIZ_POSTFIX);

    return generatedFilePath;
}

function getReferenceablesInBinaryExpression(expression: OrExpression | AndExpression, output: Set<Referenceable>): void {
    getReferencablesInExpression(expression.left, output);
    getReferencablesInExpression(expression.right, output);
}

function getReferenceablesInStatement(statement: Statement, output: Set<Referenceable>): void {
    let reference = statement.reference.ref;
    if (reference !== undefined) 
        output.add(reference);
}

function getReferencablesInExpression(expression: PropositionalExpression, output: Set<Referenceable>): void {
    switch (expression.$type) {
        case 'OrExpression': 
            getReferenceablesInBinaryExpression(expression as OrExpression, output);
            break;
        case 'AndExpression': 
            getReferenceablesInBinaryExpression(expression as AndExpression, output);
            break;
        case 'Negation': 
        getReferencablesInExpression(expression.inner, output);
            break;
        case 'Group':
            getReferencablesInExpression(expression.inner, output);
        case 'Statement': 
            getReferenceablesInStatement(expression as Statement, output);
            break;
    }
}

function getReferencableInWhenCondition(condition: WhenCondition): Set<Referenceable> {
    let result = new Set<Referenceable>();

    getReferencablesInExpression(condition.expression, result);

    return result;
}

function graphvizPropositions(propositions: Proposition[], fileNode: CompositeGeneratorNode): void {
    propositions.forEach(proposition => {
        let indentation = `\t`;
        // add node
        fileNode.append(`${indentation}${proposition.name} [${GRAPHVIZ_PROPOSITIONS_NODE_STYLE}];\n`);

        indentation += '\t';
        // add edges dor raising concerns
        proposition.valueClauses.forEach(valueDescription => {
            valueDescription.raises.forEach(raise => {
                if (raise.condition === undefined)
                    return;
                let referenceables = getReferencableInWhenCondition(raise.condition);
                referenceables.forEach(referenceable => {
                    fileNode.append(`${indentation}${referenceable.name} -> ${proposition.name} [${GRAPHVIZ_PROPOSITIONS_RAISE_EDGE_STYLE}];\n`);
                });
            });
        });

        // add edges for disabling
        if (proposition.disable !== undefined) {
            proposition.disable.statements.forEach(statement => {
                let referenceables = getReferencableInWhenCondition(statement.condition);
                referenceables.forEach(referenceable => {
                    fileNode.append(`${indentation}${referenceable.name} -> ${proposition.name} [${GRAPHVIZ_PROPOSITIONS_DISABLE_EDGE_STYLE}];\n`);
                });
            });
        }
    });
}