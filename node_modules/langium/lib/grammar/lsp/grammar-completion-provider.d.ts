/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { NextFeature } from '../../lsp/completion/follow-element-computation.js';
import type { CompletionAcceptor, CompletionContext } from '../../lsp/completion/completion-provider.js';
import { DefaultCompletionProvider } from '../../lsp/completion/completion-provider.js';
import type { LangiumServices } from '../../services.js';
import type { MaybePromise } from '../../utils/promise-util.js';
import type { AbstractElement } from '../generated/ast.js';
export declare class LangiumGrammarCompletionProvider extends DefaultCompletionProvider {
    private readonly documents;
    constructor(services: LangiumServices);
    protected completionFor(context: CompletionContext, next: NextFeature<AbstractElement>, acceptor: CompletionAcceptor): MaybePromise<void>;
    private completeImportPath;
    private getAllFiles;
}
//# sourceMappingURL=grammar-completion-provider.d.ts.map