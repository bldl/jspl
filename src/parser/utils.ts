import { Erased, Expression, LogicalExpressionExtractor } from "../../lib/language/utils";
import { AndExpression, Group, Negation, OrExpression, Statement } from "../../lib/language/generated/ast";

export type Value = string | boolean;
export type Evaluator<T = boolean> = () => T;

export function evaluate<T>(evaluator: Exclude<T, Function> | Evaluator<T>)
{
    return typeof evaluator === "function" ? (evaluator as Evaluator<T>)() : evaluator;
}

export interface State
{
    tweakables: Map<string, Value>;
    conditions: Map<string, Evaluator>;
}

export const lazyEvaluator: LogicalExpressionExtractor<Evaluator, State> = {
    fromOrExpression: (expression: Erased<OrExpression>, state: State) =>
    {
        const left = lazyEvaluator.fromExpression(expression.left, state);
        const right = lazyEvaluator.fromExpression(expression.right, state);

        return () => evaluate(left) || evaluate(right);
    },
    fromAndExpression: (expression: Erased<AndExpression>, state: State) =>
    {
        const left = lazyEvaluator.fromExpression(expression.left, state);
        const right = lazyEvaluator.fromExpression(expression.right, state);

        return () => evaluate(left) && evaluate(right);
    },
    fromNegation: (expression: Erased<Negation>, state: State) =>
    {
        const inner = lazyEvaluator.fromExpression(expression, state);
        return () => !evaluate(inner);
    },
    fromGroup: (expression: Erased<Group>, state: State) =>
    {
        return lazyEvaluator.fromExpression(expression.inner, state);
    },
    fromStatement: (expression: Erased<Statement>, state: State) =>
    {
        const { name, $type } = expression.reference.ref!;

        const get = (name: string) =>
        {
            switch ($type)
            {
                case "Condition":
                    return evaluate(state.conditions.get(name)!);
                case "Proposition":
                    return state.tweakables.get(name)!;
            }
        };

        switch (expression.negation)
        {
            case true:
                return () => get(name) !== expression.value;
            case false:
                return () => get(name) === expression.value;
        }
    },
    fromExpression: (expression: Expression, state: State) =>
    {
        switch (expression.$type)
        {
            case "OrExpression":
                return lazyEvaluator.fromOrExpression(expression, state);
            case "AndExpression":
                return lazyEvaluator.fromAndExpression(expression, state);
            case "Negation":
                return lazyEvaluator.fromNegation(expression, state);
            case "Group":
                return lazyEvaluator.fromGroup(expression, state);
            case "Statement":
                return lazyEvaluator.fromStatement(expression, state);
        }
    },
};
