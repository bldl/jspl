/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { EMPTY_SCOPE, MapScope } from '../../references/scope.js';
import { DefaultScopeComputation } from '../../references/scope-computation.js';
import { DefaultScopeProvider } from '../../references/scope-provider.js';
import { findRootNode, getContainerOfType, getDocument, streamAllContents } from '../../utils/ast-util.js';
import { toDocumentSegment } from '../../utils/cst-util.js';
import { stream } from '../../utils/stream.js';
import { AbstractType, Interface, isAction, isGrammar, isParserRule, isReturnType, Type } from '../generated/ast.js';
import { getActionType, resolveImportUri } from '../internal-grammar-util.js';
export class LangiumGrammarScopeProvider extends DefaultScopeProvider {
    constructor(services) {
        super(services);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    }
    getScope(context) {
        const referenceType = this.reflection.getReferenceType(context);
        if (referenceType === AbstractType) {
            return this.getTypeScope(referenceType, context);
        }
        else {
            return super.getScope(context);
        }
    }
    getTypeScope(referenceType, context) {
        let localScope;
        const precomputed = getDocument(context.container).precomputedScopes;
        const rootNode = findRootNode(context.container);
        if (precomputed && rootNode) {
            const allDescriptions = precomputed.get(rootNode);
            if (allDescriptions.length > 0) {
                localScope = stream(allDescriptions).filter(des => des.type === Interface || des.type === Type);
            }
        }
        const globalScope = this.getGlobalScope(referenceType, context);
        if (localScope) {
            return this.createScope(localScope, globalScope);
        }
        else {
            return globalScope;
        }
    }
    getGlobalScope(referenceType, context) {
        const grammar = getContainerOfType(context.container, isGrammar);
        if (!grammar) {
            return EMPTY_SCOPE;
        }
        const importedUris = new Set();
        this.gatherImports(grammar, importedUris);
        let importedElements = this.indexManager.allElements(referenceType, importedUris);
        if (referenceType === AbstractType) {
            importedElements = importedElements.filter(des => des.type === Interface || des.type === Type);
        }
        return new MapScope(importedElements);
    }
    gatherImports(grammar, importedUris) {
        for (const imp0rt of grammar.imports) {
            const uri = resolveImportUri(imp0rt);
            if (uri && !importedUris.has(uri.toString())) {
                importedUris.add(uri.toString());
                if (this.langiumDocuments.hasDocument(uri)) {
                    const importedDocument = this.langiumDocuments.getOrCreateDocument(uri);
                    const rootNode = importedDocument.parseResult.value;
                    if (isGrammar(rootNode)) {
                        this.gatherImports(rootNode, importedUris);
                    }
                }
            }
        }
    }
}
export class LangiumGrammarScopeComputation extends DefaultScopeComputation {
    constructor(services) {
        super(services);
        this.astNodeLocator = services.workspace.AstNodeLocator;
    }
    exportNode(node, exports, document) {
        var _a;
        super.exportNode(node, exports, document);
        if (isParserRule(node)) {
            if (!node.returnType && !node.dataType) {
                // Export inferred rule type as interface
                const typeNode = (_a = node.inferredType) !== null && _a !== void 0 ? _a : node;
                exports.push(this.createInterfaceDescription(typeNode, typeNode.name, document));
            }
            streamAllContents(node).forEach(childNode => {
                if (isAction(childNode) && childNode.inferredType) {
                    const typeName = getActionType(childNode);
                    if (typeName) {
                        // Export inferred action type as interface
                        exports.push(this.createInterfaceDescription(childNode, typeName, document));
                    }
                }
            });
        }
    }
    processNode(node, document, scopes) {
        if (isReturnType(node))
            return;
        this.processTypeNode(node, document, scopes);
        this.processActionNode(node, document, scopes);
        super.processNode(node, document, scopes);
    }
    /**
     * Add synthetic Interface in case of explicitly or implicitly inferred type:<br>
     * cases: `ParserRule: ...;` or `ParserRule infers Type: ...;`
     */
    processTypeNode(node, document, scopes) {
        var _a;
        const container = node.$container;
        if (container && isParserRule(node) && !node.returnType && !node.dataType) {
            const typeNode = (_a = node.inferredType) !== null && _a !== void 0 ? _a : node;
            scopes.add(container, this.createInterfaceDescription(typeNode, typeNode.name, document));
        }
    }
    /**
     * Add synthetic Interface in case of explicitly inferred type:
     *
     * case: `{infer Action}`
     */
    processActionNode(node, document, scopes) {
        const container = findRootNode(node);
        if (container && isAction(node) && node.inferredType) {
            const typeName = getActionType(node);
            if (typeName) {
                scopes.add(container, this.createInterfaceDescription(node, typeName, document));
            }
        }
    }
    createInterfaceDescription(node, name, document = getDocument(node)) {
        let nameNodeSegment;
        const nameSegmentGetter = () => { var _a; return nameNodeSegment !== null && nameNodeSegment !== void 0 ? nameNodeSegment : (nameNodeSegment = toDocumentSegment((_a = this.nameProvider.getNameNode(node)) !== null && _a !== void 0 ? _a : node.$cstNode)); };
        return {
            node,
            name,
            get nameSegment() {
                return nameSegmentGetter();
            },
            selectionSegment: toDocumentSegment(node.$cstNode),
            type: 'Interface',
            documentUri: document.uri,
            path: this.astNodeLocator.getAstNodePath(node)
        };
    }
}
//# sourceMappingURL=grammar-scope.js.map