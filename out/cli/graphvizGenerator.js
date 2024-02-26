import { writeFileSync, appendFileSync } from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';
const GRAPHVIZ_COLORS = {
    red: "\"#9d0208\"",
    yellow: "\"#ffba08\""
};
const GRAPHVIZ_PREFIX = "digraph G {\n";
const GRAPHVIZ_POSTFIX = "}\n";
const GRAPHVIZ_PROPOSITIONS_NODE_STYLE = "shape=oval, color=black";
const GRAPHVIZ_PROPOSITIONS_DISABLE_EDGE_STYLE = `labelfontcolor=${GRAPHVIZ_COLORS.red}, color=${GRAPHVIZ_COLORS.red}`;
const GRAPHVIZ_PROPOSITIONS_RAISE_EDGE_STYLE = `labelfontcolor=${GRAPHVIZ_COLORS.yellow}, color=${GRAPHVIZ_COLORS.yellow}`;
export function generateGraphviz(model, destination) {
    const generatedFilePath = destination;
    const propositionsNode = new CompositeGeneratorNode();
    graphvizPropositions(model.propositions, propositionsNode);
    writeFileSync(generatedFilePath, GRAPHVIZ_PREFIX);
    appendFileSync(generatedFilePath, toString(propositionsNode));
    appendFileSync(generatedFilePath, GRAPHVIZ_POSTFIX);
    return generatedFilePath;
}
function getReferenceablesInBinaryExpression(expression, output) {
    getReferencablesInExpression(expression.left, output);
    getReferencablesInExpression(expression.right, output);
}
function getReferenceablesInStatement(statement, output) {
    let reference = statement.reference.ref;
    if (reference !== undefined)
        output.add(reference);
}
function getReferencablesInExpression(expression, output) {
    switch (expression.$type) {
        case 'OrExpression':
            getReferenceablesInBinaryExpression(expression, output);
            break;
        case 'AndExpression':
            getReferenceablesInBinaryExpression(expression, output);
            break;
        case 'Negation':
            getReferencablesInExpression(expression.inner, output);
            break;
        case 'Group':
            getReferencablesInExpression(expression.inner, output);
        case 'Statement':
            getReferenceablesInStatement(expression, output);
            break;
    }
}
function getReferencablesInWhenCondition(condition) {
    let result = new Set();
    getReferencablesInExpression(condition.expression, result);
    return result;
}
function graphvizPropositions(propositions, fileNode) {
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
                let referenceables = getReferencablesInWhenCondition(raise.condition);
                referenceables.forEach(referenceable => {
                    fileNode.append(`${indentation}${referenceable.name} -> ${proposition.name} [${GRAPHVIZ_PROPOSITIONS_RAISE_EDGE_STYLE}];\n`);
                });
            });
        });
        // add edges for disabling
        if (proposition.disable !== undefined) {
            proposition.disable.statements.forEach(statement => {
                let referenceables = getReferencablesInWhenCondition(statement.condition);
                referenceables.forEach(referenceable => {
                    fileNode.append(`${indentation}${referenceable.name} -> ${proposition.name} [${GRAPHVIZ_PROPOSITIONS_DISABLE_EDGE_STYLE}];\n`);
                });
            });
        }
    });
}
//# sourceMappingURL=graphvizGenerator.js.map