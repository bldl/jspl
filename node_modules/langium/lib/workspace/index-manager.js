/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from 'vscode-languageserver';
import { getDocument } from '../utils/ast-util.js';
import { stream } from '../utils/stream.js';
import { UriUtils } from '../utils/uri-util.js';
import { ContextCache } from '../utils/caching.js';
export class DefaultIndexManager {
    constructor(services) {
        /**
         * The `simpleIndex` stores all `AstNodeDescription` items exported by a document.
         * The key used in this map is the string representation of the specific document URI.
         */
        this.simpleIndex = new Map();
        /**
         * This is a cache for the `allElements()` method.
         * It caches the descriptions from `simpleIndex` grouped by types.
         */
        this.simpleTypeIndex = new ContextCache();
        /**
         * This index keeps track of all `ReferenceDescription` items exported by a document.
         * This is used to compute which elements are affected by a document change
         * and for finding references to an AST node.
         */
        this.referenceIndex = new Map();
        this.documents = services.workspace.LangiumDocuments;
        this.serviceRegistry = services.ServiceRegistry;
        this.astReflection = services.AstReflection;
    }
    findAllReferences(targetNode, astNodePath) {
        const targetDocUri = getDocument(targetNode).uri;
        const result = [];
        this.referenceIndex.forEach(docRefs => {
            docRefs.forEach(refDescr => {
                if (UriUtils.equals(refDescr.targetUri, targetDocUri) && refDescr.targetPath === astNodePath) {
                    result.push(refDescr);
                }
            });
        });
        return stream(result);
    }
    allElements(nodeType, uris) {
        let documentUris = stream(this.simpleIndex.keys());
        if (uris) {
            documentUris = documentUris.filter(uri => !uris || uris.has(uri));
        }
        return documentUris
            .map(uri => this.getFileDescriptions(uri, nodeType))
            .flat();
    }
    getFileDescriptions(uri, nodeType) {
        var _a;
        if (!nodeType) {
            return (_a = this.simpleIndex.get(uri)) !== null && _a !== void 0 ? _a : [];
        }
        const descriptions = this.simpleTypeIndex.get(uri, nodeType, () => {
            var _a;
            const allFileDescriptions = (_a = this.simpleIndex.get(uri)) !== null && _a !== void 0 ? _a : [];
            return allFileDescriptions.filter(e => this.astReflection.isSubtype(e.type, nodeType));
        });
        return descriptions;
    }
    remove(uris) {
        for (const uri of uris) {
            const uriString = uri.toString();
            this.simpleIndex.delete(uriString);
            this.simpleTypeIndex.clear(uriString);
            this.referenceIndex.delete(uriString);
        }
    }
    async updateContent(document, cancelToken = CancellationToken.None) {
        const services = this.serviceRegistry.getServices(document.uri);
        const exports = await services.references.ScopeComputation.computeExports(document, cancelToken);
        for (const data of exports) {
            data.node = undefined; // clear reference to the AST Node
        }
        const uri = document.uri.toString();
        this.simpleIndex.set(uri, exports);
        this.simpleTypeIndex.clear(uri);
    }
    async updateReferences(document, cancelToken = CancellationToken.None) {
        const services = this.serviceRegistry.getServices(document.uri);
        const indexData = await services.workspace.ReferenceDescriptionProvider.createDescriptions(document, cancelToken);
        this.referenceIndex.set(document.uri.toString(), indexData);
    }
    isAffected(document, changedUris) {
        const references = this.referenceIndex.get(document.uri.toString());
        if (!references) {
            return false;
        }
        return references.some(ref => !ref.local && changedUris.has(ref.targetUri.toString()));
    }
}
//# sourceMappingURL=index-manager.js.map