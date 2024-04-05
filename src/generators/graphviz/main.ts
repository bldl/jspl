import { Condition, Model, Proposition, Referenceable, } from '../../language/generated/ast.js';
import { writeFileSync, appendFileSync  } from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';
import { getReferencablesInWhenCondition } from '../../util/modelUtil.js';

const COLORS = {
    red: "\"#9d0208\"",
    yellow: "\"#9e7702\"",
    green: "\"#509e02\"",
    black: "\"#000000\""
}

const DOT_PREFIX: string = "digraph G {\n";
const DOT_POSTFIX: string = "}\n";

const CONDITION_VERTEX_STYLE: string = `shape=diamond, color=${COLORS.green}`;
const CONDITION_DETERMINED_EDGE_STYLE: string = `labelfontcolor=${COLORS.green}, color=${COLORS.green}`;

const PROPOSITIONS_VERTEX_STYLE: string = `shape=oval, color=${COLORS.black}`;
const PROPOSITIONS_DISABLE_EDGE_STYLE: string = `labelfontcolor=${COLORS.red}, color=${COLORS.red}`;
const PROPOSITIONS_RAISE_EDGE_STYLE: string = `labelfontcolor=${COLORS.yellow}, color=${COLORS.yellow}`;

export function generateGraphviz(model: Model, destination: string): string {
    const generatedFilePath = destination;

    writeFileSync(generatedFilePath, DOT_PREFIX);

    // 2. Conditions
    const conditionsNode = new CompositeGeneratorNode();
    generateConditions(model.conditions, conditionsNode);
    appendFileSync(generatedFilePath, toString(conditionsNode));

    // 3. Propositions
    const propositionsNode = new CompositeGeneratorNode();
    generatePropositions(model.propositions, propositionsNode);
    appendFileSync(generatedFilePath, toString(propositionsNode));

    appendFileSync(generatedFilePath, DOT_POSTFIX);

    return generatedFilePath;
}

function generateConditions(conditions: Condition[], fileNode: CompositeGeneratorNode): void {
    fileNode.append(`\t// Conditions:\n`);
    conditions.forEach(condition => {
        // add vertex
        fileNode.append(`\t${condition.name} [${CONDITION_VERTEX_STYLE}];\n`);

        // add incoming edges
        getReferencablesInWhenCondition(condition.condition).forEach(referenceable => {
            fileNode.append(`\t\t${referenceable.name} -> ${condition.name} [${CONDITION_DETERMINED_EDGE_STYLE}];\n`);
        });
    });
}

function generatePropositions(propositions: Proposition[], fileNode: CompositeGeneratorNode): void {
    fileNode.append(`\t// Propositions:\n`);
    propositions.forEach(proposition => {
        // add vertex
        fileNode.append(`\t${proposition.name} [${PROPOSITIONS_VERTEX_STYLE}];\n`);

        // add edges for raising concerns
        getReferenceablesCausingRaises(proposition).forEach(referenceable => {
            fileNode.append(`\t\t${referenceable.name} -> ${proposition.name} [${PROPOSITIONS_RAISE_EDGE_STYLE}];\n`);
        });

        // add edges for disabling
        getReferenceablesCausingDisable(proposition).forEach(referenceable => {
            fileNode.append(`\t\t${referenceable.name} -> ${proposition.name} [${PROPOSITIONS_DISABLE_EDGE_STYLE}];\n`);
        });
    });
}

function getReferenceablesCausingRaises(proposition: Proposition): Set<Referenceable> {
    let result = new Set<Referenceable>();

    proposition.valueClauses.forEach(clause => {
        clause.raises.forEach(raise => {
            if (raise.condition === undefined) return;
            getReferencablesInWhenCondition(raise.condition).forEach(ref => {
                result.add(ref)
            });
        });
    });

    return result;
}

function getReferenceablesCausingDisable(proposition: Proposition): Set<Referenceable> {
    let result = new Set<Referenceable>();
    if (proposition.disable === undefined) return result;
    
    proposition.disable.statements.forEach(statement => {
        getReferencablesInWhenCondition(statement.condition).forEach(ref => {
            result.add(ref);
        });
    });

    return result;
}
