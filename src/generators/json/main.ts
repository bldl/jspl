import { CompositeGeneratorNode, toString } from "langium";
import { Concern, Condition, FormattedString, LaboratoryInformation, Model, Proposition, WhenCondition } from "../../language/generated/ast.js";
import { writeFileSync, appendFileSync } from "node:fs";
import { extractLaboratoryInformation, extractValueAsString, getStringFromWhenCondition } from "../../util/modelUtil.js";

export function generateJSON(model: Model, destination: string): string {
    writeFileSync(destination, "{\n");

    // 1. Laboratory Information
    const informationNode = new CompositeGeneratorNode();
    generateLaboratoryInformation(model.laboratory, informationNode);
    appendFileSync(destination, toString(informationNode));

    // 2. Concerns
    const concernsNode = new CompositeGeneratorNode();
    generateConcerns(model.concerns, concernsNode);
    appendFileSync(destination, toString(concernsNode));

    // 3. Conditions
    const conditionsNode = new CompositeGeneratorNode();
    generateConditions(model.conditions, conditionsNode);
    appendFileSync(destination, toString(conditionsNode));

    // 4. Propositions
    const propositionsNode = new CompositeGeneratorNode();
    generatePropositions(model.propositions, propositionsNode);
    appendFileSync(destination, toString(propositionsNode));

    appendFileSync(destination, "}");

    return destination;
}

function generateLaboratoryInformation(laboratory: LaboratoryInformation | undefined, fileNode: CompositeGeneratorNode): void {
    const extracted = extractLaboratoryInformation(laboratory);

    fileNode.append(`\t"laboratory": {\n`);

    const title = extracted.title === undefined ? "null" : `"${escapeString(extracted.title)}"`;
    const author = extracted.author === undefined ? "null" : `"${escapeString(extracted.author)}"`;
    const version = extracted.version === undefined ? "null" : `"${escapeString(extracted.version)}"`;
    const icon = extracted.icon === undefined ? "null" : `"${escapeString(extracted.icon)}"`;
    const format = extracted.format === undefined ? "null" : `"${escapeString(extracted.format)}"`;
    const description = extracted.description === undefined ? "null" : generateFormattedString(extracted.description);

    fileNode.append(`\t\t\"title\": ${title},\n`);
    fileNode.append(`\t\t\"author\": ${author},\n`);
    fileNode.append(`\t\t\"version\": ${version},\n`);
    fileNode.append(`\t\t\"icon\": ${icon},\n`);
    fileNode.append(`\t\t\"format\": ${format},\n`);
    fileNode.append(`\t\t\"description\": ${description}\n`);

    fileNode.append(`\t},\n`);
}

function generateConcerns(concerns: Concern[], fileNode: CompositeGeneratorNode): void {
    if (concerns.length === 0) {
        fileNode.append(`\t"concerns": [],\n`);
        return;
    }

    fileNode.append(`\t"concerns": [\n`);
    let isFirst: boolean = true;
    concerns.forEach(concern => {
        // make sure all elements except the last have a trailing comma
        if (isFirst) isFirst = false;
        else fileNode.append(`,\n`);

        fileNode.append(`\t\t{\n`);

        fileNode.append(`\t\t\t"name": "${concern.name}",\n`);
        fileNode.append(`\t\t\t"summary": "${concern.summary}",\n`);
        fileNode.append(`\t\t\t"description": ${generateFormattedString(concern.description)}\n`);

        fileNode.append(`\t\t}`);
    });
    fileNode.appendNewLine();

    fileNode.append(`\t],\n`);
}

function generateConditions(conditions: Condition[], fileNode: CompositeGeneratorNode): void {
    if (conditions.length === 0) {
        fileNode.append(`\t"conditions": [],\n`);
        return;
    }

    fileNode.append(`\t"conditions": [\n`);
    let isFirst: boolean = true;
    conditions.forEach(condition => {
        // make sure all elements except the last have a trailing comma
        if (isFirst) isFirst = false;
        else fileNode.append(`,\n`);

        fileNode.append(`\t\t{\n`);

        fileNode.append(`\t\t\t"name": "${condition.name}",\n`)
        fileNode.append(`\t\t\t"condition": "${generateWhenCondition(condition.condition)}"\n`)

        fileNode.append(`\t\t}`);
    });
    fileNode.appendNewLine();

    fileNode.append(`\t],\n`);
}

function generatePropositions(propositions: Proposition[], fileNode: CompositeGeneratorNode): void {
    if (propositions.length === 0) {
        fileNode.append(`\t"propositions": []\n`);
        return;
    }

    fileNode.append(`\t"propositions": [\n`);
    let isFirst: boolean = true;
    propositions.forEach(proposition => {
        // make sure all elements except the last have a trailing comma
        if (isFirst) isFirst = false;
        else fileNode.append(`,\n`);

        fileNode.append(`\t\t{\n`);
        fileNode.append(`\t\t\t"name": "${proposition.name}",\n`);
        fileNode.append(`\t\t\t"expression": "${proposition.expression}",\n`);

        generateValueClauses(proposition, fileNode);

        generateDisableStatements(proposition, fileNode);

        fileNode.append(`\t\t}`);
    });
    fileNode.appendNewLine();

    fileNode.append(`\t]\n`);
}

function generateValueClauses(proposition: Proposition, fileNode: CompositeGeneratorNode): void {
    if (proposition.valueClauses.length === 0) {
        fileNode.append(`\t\t\t"values": [],\n`);
        return;
    }

    fileNode.append(`\t\t\t"values": [\n`);
    let isFirstClause: boolean = true;
    proposition.valueClauses.forEach(clause => {
        if (isFirstClause) isFirstClause = false;
        else fileNode.append(`,\n`);

        fileNode.append(`\t\t\t\t{\n`)

        fileNode.append(`\t\t\t\t\t"value": ${extractValueAsString(clause.value)},\n`);
        fileNode.append(`\t\t\t\t\t"default": ${extractValueAsString(clause.default)},\n`);
        if (clause.raises.length === 0) {
            fileNode.append(`\t\t\t\t\t"raises": []\n`);
            fileNode.append(`\t\t\t\t}`);
            return;
        }

        fileNode.append(`\t\t\t\t\t"raises": [\n`);
        let isFirstRaise: boolean = true;
        clause.raises.forEach(raise => {
            if (isFirstRaise) isFirstRaise = false;
            else fileNode.append(`,\n`);

            fileNode.append(`\t\t\t\t\t\t{\n`);

            fileNode.append(`\t\t\t\t\t\t\t"concern": "${raise.concern.ref?.name}",\n`);
            fileNode.append(`\t\t\t\t\t\t\t"condition": ${raise.condition === undefined ? "null" : `"${generateWhenCondition(raise.condition)}"`}\n`);

            fileNode.append(`\t\t\t\t\t\t}`);
        });
        fileNode.append(`\n\t\t\t\t\t]\n`)
        fileNode.append(`\t\t\t\t}`);
    });
    fileNode.append(`\n\t\t\t],\n`);
}

function generateDisableStatements(proposition: Proposition, fileNode: CompositeGeneratorNode): void {
    if (proposition.disable === undefined) {
        fileNode.append(`\t\t\t"disabled": []\n`);
        return;
    }

    fileNode.append(`\t\t\t"disabled": [\n`);
    let isFirst: boolean = true;
    proposition.disable.statements.forEach(statement => {
        if (isFirst) isFirst = false;
        else fileNode.append(`,\n`);

        fileNode.append(`\t\t\t\t{\n`);

        fileNode.append(`\t\t\t\t\t"message": "${escapeString(statement.message)}",\n`)
        fileNode.append(`\t\t\t\t\t"condition": "${generateWhenCondition(statement.condition)}"\n`)

        fileNode.append(`\t\t\t\t}`);
    });
    fileNode.append(`\n\t\t\t]\n`);
}

function generateFormattedString(formatted: FormattedString): string {
    const format = formatted.format === undefined ? "null" : `"${formatted.format}"`;
    return `{"format": ${format}, "contents": "${escapeString(formatted.contents)}"}`;
}

function generateWhenCondition(condition: WhenCondition): string {
    return escapeString(getStringFromWhenCondition(condition));
}

function escapeString(input: string): string {
    return input
        .replaceAll('"', '\\"')
        //.replaceAll('\'', '\\\'')
        .replaceAll('\n', '\\n')
        .replaceAll('\t', '\\t');
}