/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { isCrossReference, isRuleCall } from '../grammar/generated/ast.js';
import { getRuleType } from '../grammar/internal-grammar-util.js';
import { getCrossReferenceTerminal } from '../utils/grammar-util.js';
export class DefaultValueConverter {
    convert(input, cstNode) {
        let feature = cstNode.grammarSource;
        if (isCrossReference(feature)) {
            feature = getCrossReferenceTerminal(feature);
        }
        if (isRuleCall(feature)) {
            const rule = feature.rule.ref;
            if (!rule) {
                throw new Error('This cst node was not parsed by a rule.');
            }
            return this.runConverter(rule, input, cstNode);
        }
        return input;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runConverter(rule, input, cstNode) {
        var _a;
        switch (rule.name.toUpperCase()) {
            case 'INT': return convertInt(input);
            case 'STRING': return convertString(input);
            case 'ID': return convertID(input);
        }
        switch ((_a = getRuleType(rule)) === null || _a === void 0 ? void 0 : _a.toLowerCase()) {
            case 'number': return convertNumber(input);
            case 'boolean': return convertBoolean(input);
            case 'bigint': return convertBigint(input);
            case 'date': return convertDate(input);
            default: return input;
        }
    }
}
export function convertString(input) {
    let result = '';
    for (let i = 1; i < input.length - 1; i++) {
        const c = input.charAt(i);
        if (c === '\\') {
            const c1 = input.charAt(++i);
            result += convertEscapeCharacter(c1);
        }
        else {
            result += c;
        }
    }
    return result;
}
function convertEscapeCharacter(char) {
    switch (char) {
        case 'b': return '\b';
        case 'f': return '\f';
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'v': return '\v';
        case '0': return '\0';
        default: return char;
    }
}
export function convertID(input) {
    if (input.charAt(0) === '^') {
        return input.substring(1);
    }
    else {
        return input;
    }
}
export function convertInt(input) {
    return parseInt(input);
}
export function convertBigint(input) {
    return BigInt(input);
}
export function convertDate(input) {
    return new Date(input);
}
export function convertNumber(input) {
    return Number(input);
}
export function convertBoolean(input) {
    return input.toLowerCase() === 'true';
}
//# sourceMappingURL=value-converter.js.map