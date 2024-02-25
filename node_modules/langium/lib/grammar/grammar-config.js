/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { DefaultNameRegexp } from '../utils/cst-util.js';
import { isCommentTerminal } from '../utils/grammar-util.js';
import { isMultilineComment } from '../utils/regex-util.js';
import { isTerminalRule } from './generated/ast.js';
import { terminalRegex } from './internal-grammar-util.js';
export function createGrammarConfig(services) {
    const rules = [];
    const grammar = services.Grammar;
    for (const rule of grammar.rules) {
        if (isTerminalRule(rule) && isCommentTerminal(rule) && isMultilineComment(terminalRegex(rule))) {
            rules.push(rule.name);
        }
    }
    return {
        multilineCommentRules: rules,
        nameRegexp: DefaultNameRegexp
    };
}
//# sourceMappingURL=grammar-config.js.map