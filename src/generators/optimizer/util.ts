import { readFileSync } from 'node:fs';
import { OrExpression, AndExpression, Negation, Group, Statement, PropositionalExpression, LaboratoryInformation } from "../../language/generated/ast.js";
import { LogicalExpressionExtractor, extractLaboratoryInformation, extractValueAsString, formattedStringToHTML } from "../../util/modelUtil.js";

export const extractJSCondition: LogicalExpressionExtractor = {
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
                return `conditions.${reference.name}(get) ${equalTo}`;
            case 'Proposition':
                return `get('${reference.name}') ${equalTo}`;
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

function splitByStartAndEndMarker(input: string, markers: {START: string, END: string}): {BEFORE: string, AFTER: string} {
    const splitByStartMarker = input.split(markers.START);

    return {
        BEFORE: splitByStartMarker[0],
        AFTER: splitByStartMarker[1].split(markers.END)[1]
    };
};

export type TemplateMarker = {START: string, END: string}
export function readTemplatedFile(templateFilePath: string, templateMarker: TemplateMarker): {prefix: string, postfix: string} {
    const template: string = readFileSync(templateFilePath, `utf-8`);
    const splitByConcernsMarkers = splitByStartAndEndMarker(template, templateMarker);

    return {
        prefix: splitByConcernsMarkers.BEFORE,
        postfix: splitByConcernsMarkers.AFTER
    };
}

export type ExtractedWebLaboratoryInformation = {
    title: string, 
    description: string,
    icon: string | undefined,
    format: string,
    author: string | undefined,
    version: string | undefined
}
const DEFAULT_WEB_LABORATORY_INFORMATION: ExtractedWebLaboratoryInformation = {
    title: "Laboratory Title",
    description: "<p>Laboratory description</p>",
    icon: undefined,
    format: "MD",
    author: undefined,
    version: undefined
}
export function extractLaboratoryInformationForWebWithDefaults(information: LaboratoryInformation | undefined): ExtractedWebLaboratoryInformation {
    const extracted = extractLaboratoryInformation(information);
    let result = DEFAULT_WEB_LABORATORY_INFORMATION;

    if (extracted.title !== undefined) result.title = extracted.title;
    if (extracted.icon !== undefined) result.icon = extracted.icon;
    if (extracted.format !== undefined) result.format = extracted.format;
    if (extracted.author !== undefined) result.author = extracted.author;
    if (extracted.version !== undefined) result.version = extracted.version;
    if (extracted.description !== undefined) result.description = formattedStringToHTML(extracted.description, result.format);

    return result;
}