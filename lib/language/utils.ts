import {
    AndExpression,
    Concern,
    Group,
    Model,
    Negation,
    OrExpression,
    PropositionalExpression,
    Referenceable,
    Statement,
} from "./generated/ast";

export type ErasedKeys<T> = T extends `$${infer K}` ? (K extends "type" ? never : T) : never;
export type NeedsErasure<T> = Extract<keyof T, `$${string}`> extends never ? false : true;

export type ErasedExpression<T> = {
    [K in keyof Omit<T, ErasedKeys<keyof T>>]: Erased<T[K]>;
};

export type ErasedUnion<T> = T extends any ? ErasedExpression<T> : never;
export type Erased<T> = NeedsErasure<T> extends true ? T | ErasedUnion<T> : T;
export type Expression = Erased<PropositionalExpression>;

export type LogicalExpressionExtractor<T, S = undefined> = {
    fromExpression: (expr: Expression, state: S) => T;
    fromOrExpression: (expr: Erased<OrExpression>, state: S) => T;
    fromAndExpression: (expr: Erased<AndExpression>, state: S) => T;
    fromNegation: (expr: Erased<Negation>, state: S) => T;
    fromGroup: (expr: Erased<Group>, state: S) => T;
    fromStatement: (expr: Erased<Statement>, state: S) => T;
    from?: (expr: Expression) => S;
};

export const extractReferenceables: LogicalExpressionExtractor<void, Set<Referenceable>> = {
    fromExpression: (expression: Expression, output: Set<Referenceable>) =>
    {
        if (expression === undefined)
        {
            return;
        }

        switch (expression.$type)
        {
            case "OrExpression":
                return extractReferenceables.fromOrExpression(expression as OrExpression, output);
            case "AndExpression":
                return extractReferenceables.fromAndExpression(expression as AndExpression, output);
            case "Negation":
                return extractReferenceables.fromNegation(expression as Negation, output);
            case "Group":
                return extractReferenceables.fromGroup(expression as Group, output);
            case "Statement":
                return extractReferenceables.fromStatement(expression as Statement, output);
        }
    },
    fromOrExpression: (expression: Erased<OrExpression>, output: Set<Referenceable>) =>
    {
        extractReferenceables.fromExpression(expression.left, output);
        extractReferenceables.fromExpression(expression.right, output);
    },
    fromAndExpression: (expression: Erased<AndExpression>, output: Set<Referenceable>) =>
    {
        extractReferenceables.fromExpression(expression.left, output);
        extractReferenceables.fromExpression(expression.right, output);
    },
    fromNegation: (expression: Erased<Negation>, output: Set<Referenceable>) =>
    {
        extractReferenceables.fromExpression(expression.inner, output);
    },
    fromGroup: (expression: Erased<Group>, output: Set<Referenceable>) =>
    {
        extractReferenceables.fromExpression(expression.inner, output);
    },
    fromStatement: (statement: Erased<Statement>, output: Set<Referenceable>) =>
    {
        const { ref } = statement.reference;

        if (ref === undefined)
        {
            return;
        }

        output.add(ref);
    },
    from: (expression: Expression) =>
    {
        const output = new Set<Referenceable>();
        extractReferenceables.fromExpression(expression, output);
        return output;
    },
};

export function getAllUsedConcerns(model: Model)
{
    const result: Concern[] = [];

    const clauses = model.propositions
        .flatMap(prop => prop.valueClauses);

    for (const clause of clauses)
    {
        result.push(...clause.raises.map(r => r.concern.ref).filter(ref => !!ref));
    }

    return new Set(result);
}

export function getAllUsedReferenceables(model: Model)
{
    const result: Referenceable[] = [];

    for (const prop of model.propositions)
    {
        const raised = prop.valueClauses
            .flatMap(clause => clause.raises)
            .filter(concern => !!concern.condition);

        for (const concern of raised)
        {
            result.push(...extractReferenceables.from!(concern.condition!.expression));
        }

        if (!prop.disable)
        {
            continue;
        }

        for (const stmt of prop.disable.statements)
        {
            result.push(...extractReferenceables.from!(stmt.condition.expression));
        }
    }

    return new Set(result);
}

export function* getAllRaisedConcerns(model: Model)
{
    for (const prop of model.propositions)
    {
        for (const clause of prop.valueClauses)
        {
            for (const concern of clause.raises)
            {
                yield { from: prop, clause, raise: concern };
            }
        }
    }
}

export function getAllConditionsForRaises(model: Model)
{
    const rtn = new Map<string, Expression[]>();

    for (const { from, clause, raise } of getAllRaisedConcerns(model))
    {
        const name = raise.concern.ref!.name;

        if (!rtn.has(name))
        {
            rtn.set(name, []);
        }

        // Pre-Condition to trigger this raise (i.e. this tweakable must have the current value [clause] to raise this concern)
        let expr: Expression = {
            $type: "Statement",
            negation: false,
            value: clause.value,
            reference: { ref: from },
        };

        // It is only raused under this specific condition
        if (raise.condition)
        {
            expr = {
                $type: "AndExpression",
                left: expr,
                right: raise.condition.expression,
            };
        }

        // The condition cannot be raised when the tweakable is disabled
        if (from.disable)
        {
            expr = {
                $type: "AndExpression",
                left: {
                    $type: "Negation",
                    inner: collapse(from.disable.statements.map(item => item.condition.expression)),
                },
                right: expr,
            };
        }

        rtn.get(name)!.push(expr);
    }

    return rtn;
}

export function collapse(expressions: Expression[])
{
    return expressions.reduce((a, b) => ({ $type: "OrExpression", left: a, right: b }));
}
