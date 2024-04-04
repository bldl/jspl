import { toString } from 'langium';
import { AndExpression, Concern, FormattedString, LaboratoryInformation, Model, OrExpression, PropositionalExpression, Referenceable, Statement, WhenCondition } from '../language/generated/ast.js';
import dedent from 'dedent-js';
import { Marked } from '@ts-stack/markdown';


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
    if (expression == undefined)
        return;

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

export function getReferencablesInWhenCondition(condition: WhenCondition): Set<Referenceable> {
    let result = new Set<Referenceable>();

    if (condition.expression != undefined)
        getReferencablesInExpression(condition.expression, result);

    return result;
}

export function getAllUsedConcerns(model: Model): Set<Concern> {
    let result = new Set<Concern>();

    model.propositions.forEach(proposition => {
        proposition.valueClauses.forEach(valueClause => {
            valueClause.raises.forEach(raisingConcern => {
                if (raisingConcern.concern?.ref != undefined)
                    result.add(raisingConcern.concern.ref);
            });
        });
    });

    return result;
}

export function getAllUsedReferenceables(model: Model): Set<Referenceable> {
    let result = new Set<Referenceable>();

    model.propositions.forEach(proposition => {
        proposition.valueClauses.forEach(valueClause => {
            valueClause.raises.forEach(raisingConcern => {
                if (raisingConcern.condition == undefined)
                    return;
                getReferencablesInWhenCondition(raisingConcern.condition).forEach(referenceable => {
                    result.add(referenceable);
                });
            });
        });

        if (proposition.disable == undefined)
            return;

        proposition.disable.statements.forEach(disableStatement => {
            getReferencablesInWhenCondition(disableStatement.condition).forEach(referenceable => {
                result.add(referenceable);
            });
        });
    });

    return result;
}

export function extractValueAsString(value: string | boolean): string {
    return (typeof value) === "string" ? `"${value}"`: toString(value);
}

export function formattedStringToHTML(formattedString: FormattedString, default_format: string = "MD"): string {
    // Extract format
    let format = formattedString.format;
    if (format == undefined)
        format = default_format;

    // Process multiline string
    const preprocessed = dedent(formattedString.contents);

    switch (format) {
        case "HTML":
            return preprocessed;
        case "MD":
            return Marked.parse(preprocessed);
        default: // This should never be reached, unless something wrong is passed into default_format
            return Marked.parse(preprocessed);
    }
}

export type ExtractedLaboratoryInformation = {
    title: string, 
    description: string,
    icon: string | undefined,
    format: string,
    author: string | undefined,
    version: string | undefined
}
const DEFAULT_APP_INFORMATION: ExtractedLaboratoryInformation = {
    title: "Laboratory Title",
    description: "<p>Laboratory Description</p>",
    icon: undefined,
    format: "MD",
    author: undefined,
    version: undefined
}
export function extractLaboratoryInformation(information: LaboratoryInformation | undefined): ExtractedLaboratoryInformation {
    let result: ExtractedLaboratoryInformation = DEFAULT_APP_INFORMATION;
    if (information != undefined) {
        if (information.titles.length > 0)
            result.title = information.titles[0];
        if (information.descriptions.length > 0)
            result.description = formattedStringToHTML(information.descriptions[0]);
        if (information.icons.length > 0)
            result.icon = information.icons[0];
        if (information.formats.length > 0)
            result.format = information.formats[0];
        if (information.authors.length > 0)
            result.author = information.authors[0];
        if (information.versions.length > 0)
            result.version = information.versions[0];
    }

    return result;
} 