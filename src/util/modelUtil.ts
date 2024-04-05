import { toString } from 'langium';
import { AndExpression, Concern, FormattedString, Group, LaboratoryInformation, Model, Negation, OrExpression, PropositionalExpression, Referenceable, Statement, WhenCondition } from '../language/generated/ast.js';
import dedent from 'dedent-js';
import { Marked } from '@ts-stack/markdown';

export type LogicalExpressionExtractor = {
    fromExpression: Function,
    fromOrExpression: Function,
    fromAndExpression: Function,
    fromNegation: Function,
    fromGroup: Function,
    fromStatement: Function
}

const extractReferenceables: LogicalExpressionExtractor = {
    fromExpression: function (expression: PropositionalExpression, output: Set<Referenceable>): void {
        if (expression === undefined)
            return;

        switch (expression.$type) {
            case 'OrExpression':
                extractReferenceables.fromOrExpression(expression as OrExpression, output);
                break;
            case 'AndExpression':
                extractReferenceables.fromAndExpression(expression as AndExpression, output);
                break;
            case 'Negation':
                extractReferenceables.fromNegation(expression as Negation, output);
                break;
            case 'Group':
                extractReferenceables.fromGroup(expression as Group, output);
                break;
            case 'Statement':
                extractReferenceables.fromStatement(expression as Statement, output);
                break;
        }
    },
    fromOrExpression: function (expression: OrExpression, output: Set<Referenceable>): void {
        extractReferenceables.fromExpression(expression.left, output);
        extractReferenceables.fromExpression(expression.right, output);
    },
    fromAndExpression: function (expression: AndExpression, output: Set<Referenceable>): void {
        extractReferenceables.fromExpression(expression.left, output);
        extractReferenceables.fromExpression(expression.right, output);
    },
    fromNegation: function (expression: Negation, output: Set<Referenceable>): void {
        extractReferenceables.fromExpression(expression.inner, output);
    },
    fromGroup: function (expression: Group, output: Set<Referenceable>): void {
        extractReferenceables.fromExpression(expression.inner, output);
    },
    fromStatement: function (statement: Statement, output: Set<Referenceable>): void {
        let reference = statement.reference.ref;
        if (reference !== undefined)
            output.add(reference);
    },
}

export function getReferencablesInWhenCondition(condition: WhenCondition): Set<Referenceable> {
    let result = new Set<Referenceable>();
    extractReferenceables.fromExpression(condition.expression, result);
    return result;
}

const extractStringFromExpression: LogicalExpressionExtractor = {
    fromExpression: function (expression: PropositionalExpression): string {
        if (expression === undefined)
            return "";

        switch (expression.$type) {
            case 'OrExpression':
                return extractStringFromExpression.fromOrExpression(expression as OrExpression);
            case 'AndExpression':
                return extractStringFromExpression.fromAndExpression(expression as AndExpression);
            case 'Negation':
                return extractStringFromExpression.fromNegation(expression as Negation);
            case 'Group':
                return extractStringFromExpression.fromGroup(expression as Group);
            case 'Statement':
                return extractStringFromExpression.fromStatement(expression as Statement);
        }
    },
    fromOrExpression: function (expression: OrExpression): string {
        return extractStringFromExpression.fromExpression(expression.left) + " or " + extractStringFromExpression.fromExpression(expression.right);
    },
    fromAndExpression: function (expression: AndExpression): string {
        return extractStringFromExpression.fromExpression(expression.left) + " or " + extractStringFromExpression.fromExpression(expression.right);
    },
    fromNegation: function (expression: Negation): string {
        return "not " + extractStringFromExpression.fromExpression(expression.inner);
    },
    fromGroup: function (expression: Group): string {
        return "(" + extractStringFromExpression.fromExpression(expression.inner) + ")";
    },
    fromStatement: function (statement: Statement): string {
        return statement.reference.$refText + ` is${statement.negation ? " not" : ""} ` + extractValueAsString(statement.value); 
         
    }
}

export function getStringFromWhenCondition(condition: WhenCondition): string {
    return extractStringFromExpression.fromExpression(condition.expression);
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

        if (proposition.disable === undefined)
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
    return (typeof value) === "string" ? `"${value}"` : toString(value);
}

export function formattedStringToHTML(formattedString: FormattedString, default_format: string = "MD"): string {
    // Extract format
    let format = formattedString.format;
    if (format === undefined)
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
    title: string | undefined,
    description: FormattedString | undefined,
    icon: string | undefined,
    format: string | undefined,
    author: string | undefined,
    version: string | undefined
}
const DEFAULT_LABORATORY_INFORMATION: ExtractedLaboratoryInformation = {
    title: undefined,
    description: undefined,
    icon: undefined,
    format: undefined,
    author: undefined,
    version: undefined
}
export function extractLaboratoryInformation(information: LaboratoryInformation | undefined): ExtractedLaboratoryInformation {
    let result: ExtractedLaboratoryInformation = DEFAULT_LABORATORY_INFORMATION;
    if (information === undefined) return result;

    if (information.titles.length > 0)
        result.title = information.titles[0];
    if (information.descriptions.length > 0)
        result.description = information.descriptions[0];
    if (information.icons.length > 0)
        result.icon = information.icons[0];
    if (information.formats.length > 0)
        result.format = information.formats[0];
    if (information.authors.length > 0)
        result.author = information.authors[0];
    if (information.versions.length > 0)
        result.version = information.versions[0];

    return result;
}
