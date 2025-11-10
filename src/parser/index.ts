import { err, ok } from "neverthrow";

import { Res } from "../../lib/utils";
import { extractModel } from "../../lib/model";
import { Concern, Model, Proposition } from "../../lib/language/generated/ast";

import { evaluate, Evaluator, lazyEvaluator, State, Value } from "./utils";

export interface Given
{
    value: Value;
    expression: string;
}

export interface Tweakable
{
    raw: Proposition;

    name: string;
    expression: string;

    value: Evaluator<Value>;
    update: (value: Value) => void;

    defaultValue: Value;
    allowedValues: Value[];

    disable: Evaluator;
    concerns: Evaluator<Concern[]>;
}

export interface Laboratory
{
    model: Model;

    title?: string;
    authors?: string[];
    description?: string;

    concerns: Map<string, Concern>;
    givens: Given[];
    tweakables: Tweakable[];
}

function evaluateConcerns({ name, valueClauses }: Proposition, state: State)
{
    const clause = valueClauses.find(item => item.value === state.tweakables.get(name))!;
    const rtn: Concern[] = [];

    for (const { condition, concern } of clause.raises)
    {
        if (condition && !evaluate(lazyEvaluator.fromExpression(condition.expression, state)))
        {
            continue;
        }

        rtn.push(concern.ref!);
    }

    return rtn;
}

function evalauteDisable({ disable }: Proposition, state: State)
{
    for (const { condition } of disable?.statements ?? [])
    {
        const expr = lazyEvaluator.fromExpression(condition.expression, state);

        if (!evaluate(expr))
        {
            continue;
        }

        return true;
    }

    return false;
}

export async function parseLaboratory(input: string): Promise<Res<Laboratory>>
{
    const model = await extractModel(input);

    if (model.isErr())
    {
        return err(model.error);
    }

    const { laboratory, propositions, conditions } = model.value;

    const state: State = {
        tweakables: new Map(),
        conditions: new Map(),
    };

    const givens: Given[] = [];
    const tweakables: Tweakable[] = [];

    for (const { name, condition } of conditions)
    {
        state.conditions.set(name, lazyEvaluator.fromExpression(condition.expression, state));
    }

    for (const { name, expression, valueClauses } of propositions.filter(item => item.valueClauses.length === 1))
    {
        const value = valueClauses[0].value;
        givens.push({ expression, value });
        state.tweakables.set(name, value);
    }

    for (const tweakable of propositions.filter(item => item.valueClauses.length !== 1))
    {
        const { name, expression, valueClauses } = tweakable;

        const defaultValue = valueClauses.find(item => item.default)!.value;
        const allowedValues = valueClauses.map(item => item.value);

        tweakables.push({
            raw: tweakable,
            name,
            expression,
            defaultValue,
            allowedValues,
            value: () => state.tweakables.get(name)!,
            update: val => state.tweakables.set(name, val),
            disable: () => evalauteDisable(tweakable, state),
            concerns: () => evalauteDisable(tweakable, state) ? [] : evaluateConcerns(tweakable, state),
        });

        state.tweakables.set(name, defaultValue);
    }

    const concerns = new Map(model.value.concerns.map(
        concern => [concern.name, concern] as const,
    ));

    return ok({
        title: laboratory?.title,
        authors: laboratory?.authors,
        description: laboratory?.description,
        version: laboratory?.version,
        concerns,
        givens,
        tweakables,
        model: model.value,
    });
}
