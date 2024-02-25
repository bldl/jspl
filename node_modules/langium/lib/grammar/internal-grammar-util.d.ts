/******************************************************************************
 * Copyright 2021-2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { URI } from '../utils/uri-util.js';
import type { LangiumDocuments } from '../workspace/documents.js';
import * as ast from '../grammar/generated/ast.js';
export * from './generated/grammar.js';
export * from './validation/validator.js';
export type Cardinality = '?' | '*' | '+' | undefined;
export type Operator = '=' | '+=' | '?=' | undefined;
export declare function isOptionalCardinality(cardinality?: Cardinality, element?: ast.AbstractElement): boolean;
export declare function isArrayCardinality(cardinality?: Cardinality): boolean;
export declare function isArrayOperator(operator?: Operator): boolean;
/**
 * Determines whether the given parser rule is a _data type rule_, meaning that it has a
 * primitive return type like `number`, `boolean`, etc.
 */
export declare function isDataTypeRule(rule: ast.ParserRule): boolean;
export declare function hasDataTypeReturn(rule: ast.ParserRule): boolean;
export declare function isDataType(type: ast.Type): boolean;
export declare function isStringType(type: ast.AbstractType | ast.TypeDefinition): boolean;
export declare function getActionAtElement(element: ast.AbstractElement): ast.Action | undefined;
export declare function getTypeName(type: ast.AbstractType | ast.InferredType): string;
export declare function getTypeNameWithoutError(type?: ast.AbstractType | ast.InferredType): string | undefined;
export declare function getExplicitRuleType(rule: ast.ParserRule): string | undefined;
export declare function getActionType(action: ast.Action): string | undefined;
export declare function getRuleType(rule: ast.AbstractRule): string;
export declare function terminalRegex(terminalRule: ast.TerminalRule): RegExp;
export declare function resolveImportUri(imp: ast.GrammarImport): URI | undefined;
export declare function resolveImport(documents: LangiumDocuments, imp: ast.GrammarImport): ast.Grammar | undefined;
export declare function resolveTransitiveImports(documents: LangiumDocuments, grammar: ast.Grammar): ast.Grammar[];
export declare function resolveTransitiveImports(documents: LangiumDocuments, importNode: ast.GrammarImport): ast.Grammar[];
export declare function extractAssignments(element: ast.AbstractElement): ast.Assignment[];
export declare function isPrimitiveType(type: string): boolean;
//# sourceMappingURL=internal-grammar-util.d.ts.map