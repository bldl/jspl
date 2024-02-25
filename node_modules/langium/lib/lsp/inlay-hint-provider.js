/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from 'vscode-languageserver';
import { streamAst } from '../utils/ast-util.js';
import { interruptAndCheck } from '../utils/promise-util.js';
export class AbstractInlayHintProvider {
    async getInlayHints(document, params, cancelToken = CancellationToken.None) {
        const root = document.parseResult.value;
        const inlayHints = [];
        const acceptor = hint => inlayHints.push(hint);
        for (const node of streamAst(root, { range: params.range })) {
            await interruptAndCheck(cancelToken);
            this.computeInlayHint(node, acceptor);
        }
        return inlayHints;
    }
}
//# sourceMappingURL=inlay-hint-provider.js.map