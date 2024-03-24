/******************************************************************************
 * This file was generated by langium-cli 2.1.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const JavaScriptPropositionalLaboratoryFormatTerminals = {
    BOOLEAN: /True|False/,
    ID: /[_a-zA-Z][\w_]*/,
    STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/,
    WS: /\s+/,
    ML_COMMENT: /\/\*[\s\S]*?\*\//,
    SL_COMMENT: /\/\/[^\n\r]*/,
};

export type PropositionalExpression = AndExpression | Group | Negation | OrExpression | Statement;

export const PropositionalExpression = 'PropositionalExpression';

export function isPropositionalExpression(item: unknown): item is PropositionalExpression {
    return reflection.isInstance(item, PropositionalExpression);
}

export type Referenceable = Condition | Proposition;

export const Referenceable = 'Referenceable';

export function isReferenceable(item: unknown): item is Referenceable {
    return reflection.isInstance(item, Referenceable);
}

export interface AndExpression extends AstNode {
    readonly $container: AndExpression | Group | Negation | OrExpression | WhenCondition;
    readonly $type: 'AndExpression';
    left: PropositionalExpression
    right: PropositionalExpression
}

export const AndExpression = 'AndExpression';

export function isAndExpression(item: unknown): item is AndExpression {
    return reflection.isInstance(item, AndExpression);
}

export interface Concern extends AstNode {
    readonly $container: Model;
    readonly $type: 'Concern';
    description: FormattedString
    name: string
    summary: string
}

export const Concern = 'Concern';

export function isConcern(item: unknown): item is Concern {
    return reflection.isInstance(item, Concern);
}

export interface Condition extends AstNode {
    readonly $container: Model;
    readonly $type: 'Condition';
    condition: WhenCondition
    name: string
}

export const Condition = 'Condition';

export function isCondition(item: unknown): item is Condition {
    return reflection.isInstance(item, Condition);
}

export interface DisableClause extends AstNode {
    readonly $container: Proposition;
    readonly $type: 'DisableClause';
    statements: Array<DisableStatement>
}

export const DisableClause = 'DisableClause';

export function isDisableClause(item: unknown): item is DisableClause {
    return reflection.isInstance(item, DisableClause);
}

export interface DisableStatement extends AstNode {
    readonly $container: DisableClause;
    readonly $type: 'DisableStatement';
    condition: WhenCondition
    message: string
}

export const DisableStatement = 'DisableStatement';

export function isDisableStatement(item: unknown): item is DisableStatement {
    return reflection.isInstance(item, DisableStatement);
}

export interface FormattedString extends AstNode {
    readonly $container: Concern | LaboratoryInformation;
    readonly $type: 'FormattedString';
    contents: string
    format?: 'HTML' | 'MD'
}

export const FormattedString = 'FormattedString';

export function isFormattedString(item: unknown): item is FormattedString {
    return reflection.isInstance(item, FormattedString);
}

export interface Group extends AstNode {
    readonly $container: AndExpression | Group | Negation | OrExpression | WhenCondition;
    readonly $type: 'Group';
    inner: PropositionalExpression
}

export const Group = 'Group';

export function isGroup(item: unknown): item is Group {
    return reflection.isInstance(item, Group);
}

export interface LaboratoryInformation extends AstNode {
    readonly $container: Model;
    readonly $type: 'LaboratoryInformation';
    descriptions: Array<FormattedString>
    icons: Array<string>
    titles: Array<string>
}

export const LaboratoryInformation = 'LaboratoryInformation';

export function isLaboratoryInformation(item: unknown): item is LaboratoryInformation {
    return reflection.isInstance(item, LaboratoryInformation);
}

export interface Model extends AstNode {
    readonly $type: 'Model';
    concerns: Array<Concern>
    conditions: Array<Condition>
    laboratory?: LaboratoryInformation
    propositions: Array<Proposition>
}

export const Model = 'Model';

export function isModel(item: unknown): item is Model {
    return reflection.isInstance(item, Model);
}

export interface Negation extends AstNode {
    readonly $container: AndExpression | Group | Negation | OrExpression | WhenCondition;
    readonly $type: 'Negation';
    inner: PropositionalExpression
}

export const Negation = 'Negation';

export function isNegation(item: unknown): item is Negation {
    return reflection.isInstance(item, Negation);
}

export interface OrExpression extends AstNode {
    readonly $container: AndExpression | Group | Negation | OrExpression | WhenCondition;
    readonly $type: 'OrExpression';
    left: PropositionalExpression
    right: PropositionalExpression
}

export const OrExpression = 'OrExpression';

export function isOrExpression(item: unknown): item is OrExpression {
    return reflection.isInstance(item, OrExpression);
}

export interface Proposition extends AstNode {
    readonly $container: Model;
    readonly $type: 'Proposition';
    disable?: DisableClause
    expression: string
    name: string
    valueClauses: Array<ValueClause>
}

export const Proposition = 'Proposition';

export function isProposition(item: unknown): item is Proposition {
    return reflection.isInstance(item, Proposition);
}

export interface RaisingConcern extends AstNode {
    readonly $container: ValueClause;
    readonly $type: 'RaisingConcern';
    concern: Reference<Concern>
    condition?: WhenCondition
}

export const RaisingConcern = 'RaisingConcern';

export function isRaisingConcern(item: unknown): item is RaisingConcern {
    return reflection.isInstance(item, RaisingConcern);
}

export interface Statement extends AstNode {
    readonly $container: AndExpression | Group | Negation | OrExpression | WhenCondition;
    readonly $type: 'Statement';
    negation: boolean
    reference: Reference<Referenceable>
    value: boolean | string
}

export const Statement = 'Statement';

export function isStatement(item: unknown): item is Statement {
    return reflection.isInstance(item, Statement);
}

export interface ValueClause extends AstNode {
    readonly $container: Proposition;
    readonly $type: 'ValueClause';
    default: boolean
    raises: Array<RaisingConcern>
    value: boolean | string
}

export const ValueClause = 'ValueClause';

export function isValueClause(item: unknown): item is ValueClause {
    return reflection.isInstance(item, ValueClause);
}

export interface WhenCondition extends AstNode {
    readonly $container: Condition | DisableStatement | RaisingConcern;
    readonly $type: 'WhenCondition';
    expression: PropositionalExpression
}

export const WhenCondition = 'WhenCondition';

export function isWhenCondition(item: unknown): item is WhenCondition {
    return reflection.isInstance(item, WhenCondition);
}

export type JavaScriptPropositionalLaboratoryFormatAstType = {
    AndExpression: AndExpression
    Concern: Concern
    Condition: Condition
    DisableClause: DisableClause
    DisableStatement: DisableStatement
    FormattedString: FormattedString
    Group: Group
    LaboratoryInformation: LaboratoryInformation
    Model: Model
    Negation: Negation
    OrExpression: OrExpression
    Proposition: Proposition
    PropositionalExpression: PropositionalExpression
    RaisingConcern: RaisingConcern
    Referenceable: Referenceable
    Statement: Statement
    ValueClause: ValueClause
    WhenCondition: WhenCondition
}

export class JavaScriptPropositionalLaboratoryFormatAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return ['AndExpression', 'Concern', 'Condition', 'DisableClause', 'DisableStatement', 'FormattedString', 'Group', 'LaboratoryInformation', 'Model', 'Negation', 'OrExpression', 'Proposition', 'PropositionalExpression', 'RaisingConcern', 'Referenceable', 'Statement', 'ValueClause', 'WhenCondition'];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case AndExpression:
            case Group:
            case Negation:
            case OrExpression:
            case Statement: {
                return this.isSubtype(PropositionalExpression, supertype);
            }
            case Condition:
            case Proposition: {
                return this.isSubtype(Referenceable, supertype);
            }
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'RaisingConcern:concern': {
                return Concern;
            }
            case 'Statement:reference': {
                return Referenceable;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case 'DisableClause': {
                return {
                    name: 'DisableClause',
                    mandatory: [
                        { name: 'statements', type: 'array' }
                    ]
                };
            }
            case 'LaboratoryInformation': {
                return {
                    name: 'LaboratoryInformation',
                    mandatory: [
                        { name: 'descriptions', type: 'array' },
                        { name: 'icons', type: 'array' },
                        { name: 'titles', type: 'array' }
                    ]
                };
            }
            case 'Model': {
                return {
                    name: 'Model',
                    mandatory: [
                        { name: 'concerns', type: 'array' },
                        { name: 'conditions', type: 'array' },
                        { name: 'propositions', type: 'array' }
                    ]
                };
            }
            case 'Proposition': {
                return {
                    name: 'Proposition',
                    mandatory: [
                        { name: 'valueClauses', type: 'array' }
                    ]
                };
            }
            case 'Statement': {
                return {
                    name: 'Statement',
                    mandatory: [
                        { name: 'negation', type: 'boolean' },
                        { name: 'value', type: 'boolean' }
                    ]
                };
            }
            case 'ValueClause': {
                return {
                    name: 'ValueClause',
                    mandatory: [
                        { name: 'default', type: 'boolean' },
                        { name: 'raises', type: 'array' },
                        { name: 'value', type: 'boolean' }
                    ]
                };
            }
            default: {
                return {
                    name: type,
                    mandatory: []
                };
            }
        }
    }
}

export const reflection = new JavaScriptPropositionalLaboratoryFormatAstReflection();
