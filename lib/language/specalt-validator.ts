import type { ValidationAcceptor, ValidationChecks } from "langium";

import { type SpecAltFormatServices } from "./specalt-format-module";
import { extractReferenceables, getAllUsedConcerns, getAllUsedReferenceables } from "./utils";
import { Condition, Model, Proposition, type SpecAltAstType, Statement } from "./generated/ast";

export function registerValidationChecks({ validation }: SpecAltFormatServices)
{
    const { ValidationRegistry: registry, SpecAltFormatValidator: validator } = validation;

    const checks: ValidationChecks<SpecAltAstType> = {
        Model: [
            validator.uniqueConcernIdentifiers,
            validator.uniqueReferenceableIdentifiers,
            validator.checkForUnusedConcerns,
            validator.checkForUnusedConditions,
        ],
        Proposition: [
            validator.propositionHasExactlyOneDefaultOrJustOneValue,
        ],
        Condition: [
            validator.noRecursionInConditions,
        ],
        Statement: [
            validator.statementReferencesValidValue,
        ],
    };

    registry.register(checks, validator);
}

export class SpecAltFormatValidator
{
    uniqueConcernIdentifiers(model: Model, accept: ValidationAcceptor)
    {
        const reported = new Set<string>();

        for (const concern of model.concerns)
        {
            if (!reported.has(concern.name))
            {
                reported.add(concern.name);
                continue;
            }

            accept("error", `Concern has non-unique name '${concern.name}'.`, { node: concern, property: "name" });
        }
    }

    uniqueReferenceableIdentifiers(model: Model, accept: ValidationAcceptor)
    {
        const reported = new Map<string, Condition | Proposition>();

        for (const item of [...model.conditions, ...model.propositions])
        {
            if (!reported.has(item.name))
            {
                reported.set(item.name, item);
                continue;
            }

            const nodes = [item, reported.get(item.name)!];

            for (const violating of nodes)
            {
                accept(
                    "error",
                    `${item.$type} has non-unique name '${violating.name}'. All names of Propositions and Conditions must be unique, to be properly referenced.`,
                    { node: violating, property: "name" },
                );
            }
        }
    }

    checkForUnusedConcerns(model: Model, accept: ValidationAcceptor)
    {
        const used = getAllUsedConcerns(model);
        const unused = model.concerns.filter(con => !used.has(con));

        for (const node of unused)
        {
            accept("warning", "Concern is defined, but never used.", { node, property: "name" });
        }
    }

    checkForUnusedConditions(model: Model, accept: ValidationAcceptor)
    {
        const used = getAllUsedReferenceables(model);
        const unused = model.conditions.filter(cond => !used.has(cond));

        for (const node of unused)
        {
            accept("warning", "Condition is defined, but never used.", { node, property: "name" });
        }
    }

    propositionHasExactlyOneDefaultOrJustOneValue(proposition: Proposition, accept: ValidationAcceptor)
    {
        const { name, valueClauses } = proposition;

        // Singleton is default implicitly
        if (valueClauses.length == 1 && !valueClauses[0].default)
        {
            return accept(
                "warning",
                `${valueClauses[0].value} of proposition ${name} is implicitly default`,
                { node: valueClauses[0], property: "default" },
            );
        }

        const defaults = valueClauses.filter(clause => clause.default);

        if (defaults.length > 1)
        {
            return accept("error", `Proposition has multiple default values.`, {
                node: defaults[1],
                property: "default",
            });
        }

        if (defaults.length === 1)
        {
            return;
        }

        accept("error", `Proposition has no default value.`, { node: proposition, property: "name" });
    }

    noRecursionInConditions(node: Condition, accept: ValidationAcceptor)
    {
        const { name, condition } = node;

        const extracted = extractReferenceables.from!(condition.expression);
        const hasRecursion = [...extracted].some(ref => ref.name === name);

        if (!hasRecursion)
        {
            return;
        }

        accept("error", `Recursion is not allowed here.`, { node, property: "name" });
    }

    statementReferencesValidValue(statement: Statement, accept: ValidationAcceptor)
    {
        if (!statement.reference.ref)
        {
            return;
        }

        const referenceable = statement.reference.ref;
        const value = statement.value;

        const reject = () =>
            accept("error", "Stated value is not a valid value of the referenced object.", {
                node: statement,
                property: "value",
            });

        if (referenceable.$type === "Condition" && typeof value !== "boolean")
        {
            return reject();
        }

        if (referenceable.$type === "Condition")
        {
            return;
        }

        const proposition = referenceable as Proposition;

        if (!proposition.valueClauses || proposition.valueClauses.some(x => x.value === value))
        {
            return;
        }

        reject();
    }
}
