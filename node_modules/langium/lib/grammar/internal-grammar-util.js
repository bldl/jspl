/******************************************************************************
 * Copyright 2021-2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import * as ast from '../grammar/generated/ast.js';
import { getDocument, streamAllContents } from '../utils/ast-util.js';
import { TypeResolutionError } from './type-system/type-collector/types.js';
import { escapeRegExp } from '../utils/regex-util.js';
import { UriUtils } from '../utils/uri-util.js';
export * from './generated/grammar.js';
export * from './validation/validator.js';
export function isOptionalCardinality(cardinality, element) {
    return cardinality === '?' || cardinality === '*' || (ast.isGroup(element) && Boolean(element.guardCondition));
}
export function isArrayCardinality(cardinality) {
    return cardinality === '*' || cardinality === '+';
}
export function isArrayOperator(operator) {
    return operator === '+=';
}
/**
 * Determines whether the given parser rule is a _data type rule_, meaning that it has a
 * primitive return type like `number`, `boolean`, etc.
 */
export function isDataTypeRule(rule) {
    return isDataTypeRuleInternal(rule, new Set());
}
function isDataTypeRuleInternal(rule, visited) {
    if (visited.has(rule)) {
        return true;
    }
    else {
        visited.add(rule);
    }
    for (const node of streamAllContents(rule)) {
        if (ast.isRuleCall(node)) {
            if (!node.rule.ref) {
                // RuleCall to unresolved rule. Don't assume `rule` is a DataType rule.
                return false;
            }
            if (ast.isParserRule(node.rule.ref) && !isDataTypeRuleInternal(node.rule.ref, visited)) {
                return false;
            }
        }
        else if (ast.isAssignment(node)) {
            return false;
        }
        else if (ast.isAction(node)) {
            return false;
        }
    }
    return Boolean(rule.definition);
}
export function hasDataTypeReturn(rule) {
    var _a;
    const returnType = (_a = rule.returnType) === null || _a === void 0 ? void 0 : _a.ref;
    return rule.dataType !== undefined || (ast.isType(returnType) && isDataType(returnType));
}
export function isDataType(type) {
    return isDataTypeInternal(type.type, new Set());
}
function isDataTypeInternal(type, visited) {
    if (visited.has(type)) {
        return true;
    }
    else {
        visited.add(type);
    }
    if (ast.isArrayType(type)) {
        return false;
    }
    else if (ast.isReferenceType(type)) {
        return false;
    }
    else if (ast.isUnionType(type)) {
        return type.types.every(e => isDataTypeInternal(e, visited));
    }
    else if (ast.isSimpleType(type)) {
        if (type.primitiveType !== undefined) {
            return true;
        }
        else if (type.stringType !== undefined) {
            return true;
        }
        else if (type.typeRef !== undefined) {
            const ref = type.typeRef.ref;
            if (ast.isType(ref)) {
                return isDataTypeInternal(ref.type, visited);
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
export function isStringType(type) {
    return isStringTypeInternal(type, new Set());
}
function isStringTypeInternal(type, visited) {
    var _a, _b;
    if (visited.has(type)) {
        return true;
    }
    else {
        visited.add(type);
    }
    if (ast.isParserRule(type)) {
        if (type.dataType) {
            return type.dataType === 'string';
        }
        if ((_a = type.returnType) === null || _a === void 0 ? void 0 : _a.ref) {
            return isStringTypeInternal(type.returnType.ref, visited);
        }
    }
    else if (ast.isType(type)) {
        return isStringTypeInternal(type.type, visited);
    }
    else if (ast.isArrayType(type)) {
        return false;
    }
    else if (ast.isReferenceType(type)) {
        return false;
    }
    else if (ast.isUnionType(type)) {
        return type.types.every(e => isStringTypeInternal(e, visited));
    }
    else if (ast.isSimpleType(type)) {
        if (type.primitiveType === 'string') {
            return true;
        }
        else if (type.stringType) {
            return true;
        }
        else if ((_b = type.typeRef) === null || _b === void 0 ? void 0 : _b.ref) {
            return isStringTypeInternal(type.typeRef.ref, visited);
        }
    }
    return false;
}
export function getActionAtElement(element) {
    const parent = element.$container;
    if (ast.isGroup(parent)) {
        const elements = parent.elements;
        const index = elements.indexOf(element);
        for (let i = index - 1; i >= 0; i--) {
            const item = elements[i];
            if (ast.isAction(item)) {
                return item;
            }
            else {
                const action = streamAllContents(elements[i]).find(ast.isAction);
                if (action) {
                    return action;
                }
            }
        }
    }
    if (ast.isAbstractElement(parent)) {
        return getActionAtElement(parent);
    }
    else {
        return undefined;
    }
}
export function getTypeName(type) {
    var _a;
    if (ast.isParserRule(type)) {
        return isDataTypeRule(type) ? type.name : (_a = getExplicitRuleType(type)) !== null && _a !== void 0 ? _a : type.name;
    }
    else if (ast.isInterface(type) || ast.isType(type) || ast.isReturnType(type)) {
        return type.name;
    }
    else if (ast.isAction(type)) {
        const actionType = getActionType(type);
        if (actionType) {
            return actionType;
        }
    }
    else if (ast.isInferredType(type)) {
        return type.name;
    }
    throw new TypeResolutionError('Cannot get name of Unknown Type', type.$cstNode);
}
export function getTypeNameWithoutError(type) {
    if (!type) {
        return undefined;
    }
    try {
        return getTypeName(type);
    }
    catch (_a) {
        return undefined;
    }
}
export function getExplicitRuleType(rule) {
    if (rule.inferredType) {
        return rule.inferredType.name;
    }
    else if (rule.dataType) {
        return rule.dataType;
    }
    else if (rule.returnType) {
        const refType = rule.returnType.ref;
        if (refType) {
            // check if we need to check Action as return type
            if (ast.isParserRule(refType)) {
                return refType.name;
            }
            else if (ast.isInterface(refType) || ast.isType(refType)) {
                return refType.name;
            }
        }
    }
    return undefined;
}
export function getActionType(action) {
    var _a;
    if (action.inferredType) {
        return action.inferredType.name;
    }
    else if ((_a = action.type) === null || _a === void 0 ? void 0 : _a.ref) {
        return getTypeName(action.type.ref);
    }
    return undefined; // not inferring and not referencing a valid type
}
export function getRuleType(rule) {
    var _a, _b, _c;
    if (ast.isTerminalRule(rule)) {
        return (_b = (_a = rule.type) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'string';
    }
    else {
        return isDataTypeRule(rule) ? rule.name : (_c = getExplicitRuleType(rule)) !== null && _c !== void 0 ? _c : rule.name;
    }
}
export function terminalRegex(terminalRule) {
    const flags = {
        s: false,
        i: false,
        u: false
    };
    const source = abstractElementToRegex(terminalRule.definition, flags);
    const flagText = Object.entries(flags).filter(([, value]) => value).map(([name]) => name).join('');
    return new RegExp(source, flagText);
}
// Using [\s\S]* allows to match everything, compared to . which doesn't match line terminators
const WILDCARD = /[\s\S]/.source;
function abstractElementToRegex(element, flags) {
    if (ast.isTerminalAlternatives(element)) {
        return terminalAlternativesToRegex(element);
    }
    else if (ast.isTerminalGroup(element)) {
        return terminalGroupToRegex(element);
    }
    else if (ast.isCharacterRange(element)) {
        return characterRangeToRegex(element);
    }
    else if (ast.isTerminalRuleCall(element)) {
        const rule = element.rule.ref;
        if (!rule) {
            throw new Error('Missing rule reference.');
        }
        return withCardinality(abstractElementToRegex(rule.definition), {
            cardinality: element.cardinality,
            lookahead: element.lookahead
        });
    }
    else if (ast.isNegatedToken(element)) {
        return negateTokenToRegex(element);
    }
    else if (ast.isUntilToken(element)) {
        return untilTokenToRegex(element);
    }
    else if (ast.isRegexToken(element)) {
        const lastSlash = element.regex.lastIndexOf('/');
        const source = element.regex.substring(1, lastSlash);
        const regexFlags = element.regex.substring(lastSlash + 1);
        if (flags) {
            flags.i = regexFlags.includes('i');
            flags.s = regexFlags.includes('s');
            flags.u = regexFlags.includes('u');
        }
        return withCardinality(source, {
            cardinality: element.cardinality,
            lookahead: element.lookahead,
            wrap: false
        });
    }
    else if (ast.isWildcard(element)) {
        return withCardinality(WILDCARD, {
            cardinality: element.cardinality,
            lookahead: element.lookahead
        });
    }
    else {
        throw new Error(`Invalid terminal element: ${element === null || element === void 0 ? void 0 : element.$type}`);
    }
}
function terminalAlternativesToRegex(alternatives) {
    return withCardinality(alternatives.elements.map(e => abstractElementToRegex(e)).join('|'), {
        cardinality: alternatives.cardinality,
        lookahead: alternatives.lookahead
    });
}
function terminalGroupToRegex(group) {
    return withCardinality(group.elements.map(e => abstractElementToRegex(e)).join(''), {
        cardinality: group.cardinality,
        lookahead: group.lookahead
    });
}
function untilTokenToRegex(until) {
    return withCardinality(`${WILDCARD}*?${abstractElementToRegex(until.terminal)}`, {
        cardinality: until.cardinality,
        lookahead: until.lookahead
    });
}
function negateTokenToRegex(negate) {
    return withCardinality(`(?!${abstractElementToRegex(negate.terminal)})${WILDCARD}*?`, {
        cardinality: negate.cardinality,
        lookahead: negate.lookahead
    });
}
function characterRangeToRegex(range) {
    if (range.right) {
        return withCardinality(`[${keywordToRegex(range.left)}-${keywordToRegex(range.right)}]`, {
            cardinality: range.cardinality,
            lookahead: range.lookahead,
            wrap: false
        });
    }
    return withCardinality(keywordToRegex(range.left), {
        cardinality: range.cardinality,
        lookahead: range.lookahead,
        wrap: false
    });
}
function keywordToRegex(keyword) {
    return escapeRegExp(keyword.value);
}
function withCardinality(regex, options) {
    var _a;
    if (options.wrap !== false || options.lookahead) {
        regex = `(${(_a = options.lookahead) !== null && _a !== void 0 ? _a : ''}${regex})`;
    }
    if (options.cardinality) {
        return `${regex}${options.cardinality}`;
    }
    return regex;
}
export function resolveImportUri(imp) {
    if (imp.path === undefined || imp.path.length === 0) {
        return undefined;
    }
    const dirUri = UriUtils.dirname(getDocument(imp).uri);
    let grammarPath = imp.path;
    if (!grammarPath.endsWith('.langium')) {
        grammarPath += '.langium';
    }
    return UriUtils.resolvePath(dirUri, grammarPath);
}
export function resolveImport(documents, imp) {
    const resolvedUri = resolveImportUri(imp);
    try {
        if (resolvedUri) {
            const resolvedDocument = documents.getOrCreateDocument(resolvedUri);
            const node = resolvedDocument.parseResult.value;
            if (ast.isGrammar(node)) {
                return node;
            }
        }
    }
    catch (_a) {
        // NOOP
    }
    return undefined;
}
export function resolveTransitiveImports(documents, grammarOrImport) {
    if (ast.isGrammarImport(grammarOrImport)) {
        const resolvedGrammar = resolveImport(documents, grammarOrImport);
        if (resolvedGrammar) {
            const transitiveGrammars = resolveTransitiveImportsInternal(documents, resolvedGrammar);
            transitiveGrammars.push(resolvedGrammar);
            return transitiveGrammars;
        }
        return [];
    }
    else {
        return resolveTransitiveImportsInternal(documents, grammarOrImport);
    }
}
function resolveTransitiveImportsInternal(documents, grammar, initialGrammar = grammar, visited = new Set(), grammars = new Set()) {
    const doc = getDocument(grammar);
    if (initialGrammar !== grammar) {
        grammars.add(grammar);
    }
    if (!visited.has(doc.uri)) {
        visited.add(doc.uri);
        for (const imp of grammar.imports) {
            const importedGrammar = resolveImport(documents, imp);
            if (importedGrammar) {
                resolveTransitiveImportsInternal(documents, importedGrammar, initialGrammar, visited, grammars);
            }
        }
    }
    return Array.from(grammars);
}
export function extractAssignments(element) {
    if (ast.isAssignment(element)) {
        return [element];
    }
    else if (ast.isAlternatives(element) || ast.isGroup(element) || ast.isUnorderedGroup(element)) {
        return element.elements.flatMap(e => extractAssignments(e));
    }
    else if (ast.isRuleCall(element) && element.rule.ref) {
        return extractAssignments(element.rule.ref.definition);
    }
    return [];
}
const primitiveTypes = ['string', 'number', 'boolean', 'Date', 'bigint'];
export function isPrimitiveType(type) {
    return primitiveTypes.includes(type);
}
//# sourceMappingURL=internal-grammar-util.js.map