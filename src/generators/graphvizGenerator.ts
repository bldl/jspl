import { Model, Proposition, } from '../language/generated/ast.js';
import { writeFileSync, appendFileSync  } from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';
import { getReferencablesInWhenCondition } from '../util/modelUtil.js';

const GRAPHVIZ_COLORS = {
    red: "\"#9d0208\"",
    yellow: "\"#ffba08\""
}

const GRAPHVIZ_PREFIX: string = "digraph G {\n";
const GRAPHVIZ_POSTFIX: string = "}\n";
const GRAPHVIZ_PROPOSITIONS_NODE_STYLE: string = "shape=oval, color=black";
const GRAPHVIZ_PROPOSITIONS_DISABLE_EDGE_STYLE: string = `labelfontcolor=${GRAPHVIZ_COLORS.red}, color=${GRAPHVIZ_COLORS.red}`;
const GRAPHVIZ_PROPOSITIONS_RAISE_EDGE_STYLE: string = `labelfontcolor=${GRAPHVIZ_COLORS.yellow}, color=${GRAPHVIZ_COLORS.yellow}`;

export function generateGraphviz(model: Model, destination: string): string {
    const generatedFilePath = destination;

    const propositionsNode = new CompositeGeneratorNode();
    
    graphvizPropositions(model.propositions, propositionsNode);

    writeFileSync(generatedFilePath, GRAPHVIZ_PREFIX);
    appendFileSync(generatedFilePath, toString(propositionsNode));
    appendFileSync(generatedFilePath, GRAPHVIZ_POSTFIX);

    return generatedFilePath;
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