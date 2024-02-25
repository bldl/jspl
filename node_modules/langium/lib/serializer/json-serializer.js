/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { isAstNode, isReference } from '../syntax-tree.js';
import { getDocument } from '../utils/ast-util.js';
import { findNodesForProperty } from '../utils/grammar-util.js';
export function isAstNodeWithComment(node) {
    return typeof node.$comment === 'string';
}
function isIntermediateReference(obj) {
    return typeof obj === 'object' && !!obj && ('$ref' in obj || '$error' in obj);
}
export class DefaultJsonSerializer {
    constructor(services) {
        this.ignoreProperties = new Set(['$container', '$containerProperty', '$containerIndex', '$document', '$cstNode']);
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.nameProvider = services.references.NameProvider;
        this.commentProvider = services.documentation.CommentProvider;
    }
    serialize(node, options) {
        const specificReplacer = options === null || options === void 0 ? void 0 : options.replacer;
        const defaultReplacer = (key, value) => this.replacer(key, value, options);
        const replacer = specificReplacer ? (key, value) => specificReplacer(key, value, defaultReplacer) : defaultReplacer;
        return JSON.stringify(node, replacer, options === null || options === void 0 ? void 0 : options.space);
    }
    deserialize(content) {
        const root = JSON.parse(content);
        this.linkNode(root, root);
        return root;
    }
    replacer(key, value, { refText, sourceText, textRegions, comments } = {}) {
        var _a, _b, _c;
        if (this.ignoreProperties.has(key)) {
            return undefined;
        }
        else if (isReference(value)) {
            const refValue = value.ref;
            const $refText = refText ? value.$refText : undefined;
            if (refValue) {
                return {
                    $refText,
                    $ref: '#' + (refValue && this.astNodeLocator.getAstNodePath(refValue))
                };
            }
            else {
                return {
                    $refText,
                    $error: (_b = (_a = value.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : 'Could not resolve reference'
                };
            }
        }
        else {
            let astNode = undefined;
            if (textRegions && isAstNode(value)) {
                astNode = this.addAstNodeRegionWithAssignmentsTo(Object.assign({}, value));
                if ((!key || value.$document) && (astNode === null || astNode === void 0 ? void 0 : astNode.$textRegion)) {
                    try {
                        astNode.$textRegion.documentURI = getDocument(value).uri.toString();
                    }
                    catch (e) { /* do nothing */ }
                }
            }
            if (sourceText && !key && isAstNode(value)) {
                astNode !== null && astNode !== void 0 ? astNode : (astNode = Object.assign({}, value));
                astNode.$sourceText = (_c = value.$cstNode) === null || _c === void 0 ? void 0 : _c.text;
            }
            if (comments && isAstNode(value)) {
                astNode !== null && astNode !== void 0 ? astNode : (astNode = Object.assign({}, value));
                astNode.$comment = this.commentProvider.getComment(value);
            }
            return astNode !== null && astNode !== void 0 ? astNode : value;
        }
    }
    addAstNodeRegionWithAssignmentsTo(node) {
        const createDocumentSegment = cstNode => ({
            offset: cstNode.offset,
            end: cstNode.end,
            length: cstNode.length,
            range: cstNode.range,
        });
        if (node.$cstNode) {
            const textRegion = node.$textRegion = createDocumentSegment(node.$cstNode);
            const assignments = textRegion.assignments = {};
            Object.keys(node).filter(key => !key.startsWith('$')).forEach(key => {
                const propertyAssignments = findNodesForProperty(node.$cstNode, key).map(createDocumentSegment);
                if (propertyAssignments.length !== 0) {
                    assignments[key] = propertyAssignments;
                }
            });
            return node;
        }
        return undefined;
    }
    linkNode(node, root, container, containerProperty, containerIndex) {
        for (const [propertyName, item] of Object.entries(node)) {
            if (Array.isArray(item)) {
                for (let index = 0; index < item.length; index++) {
                    const element = item[index];
                    if (isIntermediateReference(element)) {
                        item[index] = this.reviveReference(node, propertyName, root, element);
                    }
                    else if (isAstNode(element)) {
                        this.linkNode(element, root, node, propertyName, index);
                    }
                }
            }
            else if (isIntermediateReference(item)) {
                node[propertyName] = this.reviveReference(node, propertyName, root, item);
            }
            else if (isAstNode(item)) {
                this.linkNode(item, root, node, propertyName);
            }
        }
        const mutable = node;
        mutable.$container = container;
        mutable.$containerProperty = containerProperty;
        mutable.$containerIndex = containerIndex;
    }
    reviveReference(container, property, root, reference) {
        let refText = reference.$refText;
        if (reference.$ref) {
            const ref = this.getRefNode(root, reference.$ref);
            if (!refText) {
                refText = this.nameProvider.getName(ref);
            }
            return {
                $refText: refText !== null && refText !== void 0 ? refText : '',
                ref
            };
        }
        else if (reference.$error) {
            const ref = {
                $refText: refText !== null && refText !== void 0 ? refText : ''
            };
            ref.error = {
                container,
                property,
                message: reference.$error,
                reference: ref
            };
            return ref;
        }
        else {
            return undefined;
        }
    }
    getRefNode(root, path) {
        return this.astNodeLocator.getAstNode(root, path.substring(1));
    }
}
//# sourceMappingURL=json-serializer.js.map