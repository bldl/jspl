/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { createDefaultModule, createDefaultSharedModule } from '../default-module.js';
import { inject } from '../dependency-injection.js';
import { LangiumGrammarGeneratedModule, LangiumGrammarGeneratedSharedModule } from './generated/module.js';
import { LangiumGrammarScopeComputation, LangiumGrammarScopeProvider } from './references/grammar-scope.js';
import { LangiumGrammarValidator, registerValidationChecks } from './validation/validator.js';
import { LangiumGrammarCodeActionProvider } from './lsp/grammar-code-actions.js';
import { LangiumGrammarCompletionProvider } from './lsp/grammar-completion-provider.js';
import { LangiumGrammarFoldingRangeProvider } from './lsp/grammar-folding-ranges.js';
import { LangiumGrammarFormatter } from './lsp/grammar-formatter.js';
import { LangiumGrammarSemanticTokenProvider } from './lsp/grammar-semantic-tokens.js';
import { LangiumGrammarNameProvider } from './references/grammar-naming.js';
import { LangiumGrammarReferences } from './references/grammar-references.js';
import { LangiumGrammarDefinitionProvider } from './lsp/grammar-definition.js';
import { LangiumGrammarCallHierarchyProvider } from './lsp/grammar-call-hierarchy.js';
import { LangiumGrammarValidationResourcesCollector } from './validation/validation-resources-collector.js';
import { LangiumGrammarTypesValidator, registerTypeValidationChecks } from './validation/types-validator.js';
import { interruptAndCheck } from '../utils/promise-util.js';
import { DocumentState } from '../workspace/documents.js';
export const LangiumGrammarModule = {
    validation: {
        LangiumGrammarValidator: (services) => new LangiumGrammarValidator(services),
        ValidationResourcesCollector: (services) => new LangiumGrammarValidationResourcesCollector(services),
        LangiumGrammarTypesValidator: () => new LangiumGrammarTypesValidator(),
    },
    lsp: {
        FoldingRangeProvider: (services) => new LangiumGrammarFoldingRangeProvider(services),
        CodeActionProvider: (services) => new LangiumGrammarCodeActionProvider(services),
        SemanticTokenProvider: (services) => new LangiumGrammarSemanticTokenProvider(services),
        Formatter: () => new LangiumGrammarFormatter(),
        DefinitionProvider: (services) => new LangiumGrammarDefinitionProvider(services),
        CallHierarchyProvider: (services) => new LangiumGrammarCallHierarchyProvider(services),
        CompletionProvider: (services) => new LangiumGrammarCompletionProvider(services)
    },
    references: {
        ScopeComputation: (services) => new LangiumGrammarScopeComputation(services),
        ScopeProvider: (services) => new LangiumGrammarScopeProvider(services),
        References: (services) => new LangiumGrammarReferences(services),
        NameProvider: () => new LangiumGrammarNameProvider()
    }
};
export function createLangiumGrammarServices(context, sharedModule) {
    const shared = inject(createDefaultSharedModule(context), LangiumGrammarGeneratedSharedModule, sharedModule);
    const grammar = inject(createDefaultModule({ shared }), LangiumGrammarGeneratedModule, LangiumGrammarModule);
    addTypeCollectionPhase(shared, grammar);
    shared.ServiceRegistry.register(grammar);
    registerValidationChecks(grammar);
    registerTypeValidationChecks(grammar);
    return { shared, grammar };
}
function addTypeCollectionPhase(sharedServices, grammarServices) {
    const documentBuilder = sharedServices.workspace.DocumentBuilder;
    documentBuilder.onBuildPhase(DocumentState.IndexedReferences, async (documents, cancelToken) => {
        for (const document of documents) {
            await interruptAndCheck(cancelToken);
            const typeCollector = grammarServices.validation.ValidationResourcesCollector;
            const grammar = document.parseResult.value;
            document.validationResources = typeCollector.collectValidationResources(grammar);
        }
    });
}
//# sourceMappingURL=langium-grammar-module.js.map