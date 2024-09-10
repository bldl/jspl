import { CompositeGeneratorNode } from "langium";
import { DisableClause, Model } from "../../language/generated/ast.js";
import { LExpression, LStatement, propositionalToLogical } from "./logic.js";

export function generateRaiseConditions(model: Model, node: CompositeGeneratorNode) {
    node.append("export const raiseConditions = {\n");

    model.concerns.forEach(concern => {
        let condition = generateDisjunction(extractRelatedConditions(model, concern.name));
        if (condition !== undefined) {
            let simplified = simplifyCondition(condition);
            node.append(`\t${concern.name}: ${JSON.stringify(simplified)},\n`);
        }
    });

    node.append("};\n");
}

function extractRelatedConditions(model: Model, concernName: string): Array<LExpression> {
    let result = Array<LExpression>();

    model.propositions.forEach(proposition => {
        proposition.valueClauses.forEach(valueClause => {
            valueClause.raises
            .filter(raise => (raise.concern.ref?.name === concernName))
            .forEach(raise => {
                let valueStatement: LStatement = {type: "statement", proposition: proposition.name, value: valueClause.value};

                let baseExpression: LExpression;

                if (raise.condition === undefined) {
                    // concern is always raised whenever the proposition is set to this value
                    baseExpression = valueStatement;
                } else {
                    // concern is only raised when proposition is set to this value AND the condition holds
                    baseExpression = {
                        type: "and",
                        left: valueStatement,
                        right: propositionalToLogical(raise.condition.expression)
                    };
                }

                // Ensure the condition is only true when the proposition is not disabled
                if (proposition.disable === undefined) {
                    result.push(baseExpression);
                } else {
                    result.push({
                        type: "and",
                        left: {
                            type: "not",
                            inner: lExpressionFromDisable(proposition.disable)
                        },
                        right: baseExpression
                    });
                }
            })
        })
    });

    return result;
}

function generateDisjunction(conditions: Array<LExpression>): LExpression | undefined{
    if (conditions.length === 0) {
        // concern is never raised so we can signal to ignore this concern completely
        return undefined;
    }
    if (conditions.length === 1) {
        return conditions[0];
    }

    let result = conditions.pop();
    if (result === undefined) return undefined;

    while (conditions.length >= 1) {
        let current = conditions.pop();
        if (current === undefined) return undefined;
        result = {
            type: "or",
            left: current,
            right: result
        }
    }

    return result;
}

function simplifyCondition(condition: LExpression): LExpression {
    // TODO:
    return condition;
}

function lExpressionFromDisable(disable: DisableClause): LExpression {
    let condition = generateDisjunction(
        disable.statements.map(
            statement => (propositionalToLogical(statement.condition.expression))
        )
    );
    if (condition === undefined) {
        throw new Error("Unexpected Error"); // This cant happen
    }

    return condition;
}