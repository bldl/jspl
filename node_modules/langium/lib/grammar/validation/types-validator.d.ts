/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { ValidationAcceptor } from '../../validation/validation-registry.js';
import type { LangiumGrammarServices } from '../langium-grammar-module.js';
import * as ast from '../generated/ast.js';
export declare function registerTypeValidationChecks(services: LangiumGrammarServices): void;
export declare class LangiumGrammarTypesValidator {
    checkCyclicType(type: ast.Type, accept: ValidationAcceptor): void;
    checkCyclicInterface(type: ast.Interface, accept: ValidationAcceptor): void;
    checkDeclaredTypesConsistency(grammar: ast.Grammar, accept: ValidationAcceptor): void;
    checkDeclaredAndInferredTypesConsistency(grammar: ast.Grammar, accept: ValidationAcceptor): void;
    checkActionIsNotUnionType(action: ast.Action, accept: ValidationAcceptor): void;
}
//# sourceMappingURL=types-validator.d.ts.map