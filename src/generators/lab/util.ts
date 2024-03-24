import { toString } from "langium";
import { readFileSync } from 'node:fs';
import { OrExpression, AndExpression, Negation, Group, Statement, PropositionalExpression, FormattedString, LaboratoryInformation } from "../../language/generated/ast.js";
import { Marked } from "@ts-stack/markdown";
import dedent from "dedent-js";

export function extractValueAsString(value: string | boolean): string {
    return (typeof value) === "string" ? `"${value}"`: toString(value);
}

export function formattedStringToHTML(formattedString: FormattedString): string {
    const preprocessed = dedent(formattedString.contents);

    // default to markdown
    let format = formattedString.format;
    if (format == undefined)
        format = "MD";

    switch (format) {
        case "HTML":
            return preprocessed;
        case "MD":
            return Marked.parse(preprocessed);
    }
}

export const extractJSCondition = {
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

export type ExtractedLaboratoryInformation = {title: string, description: string, icon: string}
const DEFAULT_APP_INFORMATION: ExtractedLaboratoryInformation = {
    title: "Laboratory Title",
    description: "<p>Laboratory Description</p>",
    icon: "./res/favicon.svg"
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
    }

    return result;
} 