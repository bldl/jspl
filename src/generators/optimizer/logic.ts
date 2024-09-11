import { AndExpression, Group, Negation, OrExpression, PropositionalExpression, Statement } from "../../language/generated/ast.js";
import { LogicalExpressionExtractor } from "../../util/modelUtil.js";

export type LConjunction = {
    type: "and",
    left: LExpression,
    right: LExpression,
};

export type LDisjunction = {
    type: "or",
    left: LExpression,
    right: LExpression,
};

export type LNegation = {
    type: "not",
    inner: LExpression,
};

export type LStatement = {
    type: "statement",
    proposition: string,
    value: boolean | string,
};

export type LExpression = LConjunction | LDisjunction | LNegation | LStatement;

export function propositionalToLogical(expression: PropositionalExpression): LExpression {
    return extractLogicalExpression.fromExpression(expression);
}

const extractLogicalExpression: LogicalExpressionExtractor = {
    fromAndExpression: function (expression: OrExpression): LConjunction {
        return {
            type: "and",
            left: extractLogicalExpression.fromExpression(expression.left),
            right: extractLogicalExpression.fromExpression(expression.right)
        }
    },
    fromOrExpression: function (expression: AndExpression): LDisjunction {
        return {
            type: "or",
            left: extractLogicalExpression.fromExpression(expression.left),
            right: extractLogicalExpression.fromExpression(expression.right)
        }
    },
    fromNegation: function (expression: Negation): LNegation {
        return {
            type: "not",
            inner: extractLogicalExpression.fromExpression(expression.inner)
        }
    },
    fromGroup: function (expression: Group): LExpression {
        return extractLogicalExpression.fromExpression(expression.inner);
    },
    fromStatement: function (expression: Statement): LExpression {
        let ref = expression.reference.ref;
        // ref cant really be undefined here unless there is a syntactical mistake in the input, then crashing is okay...
        if (ref?.$type === undefined) {
            throw new Error("Can't resolve references correctly.");
        }

        // extract base statement
        let baseStatement: LExpression;
        if (ref?.$type === "Proposition") {   
            baseStatement = {
                type: "statement",
                proposition: ref.name,
                value: expression.value
            }
        } else {
            baseStatement = extractLogicalExpression.fromExpression(ref.condition.expression);
        }

        // negate if necessary
        if (expression.negation) {
            return {
                type: "not",
                inner: baseStatement
            }
        }

        return baseStatement;
    },
    fromExpression: function (expression: PropositionalExpression): LExpression {
        switch (expression.$type) {
            case 'OrExpression': 
                return extractLogicalExpression.fromOrExpression(expression as OrExpression);
            case 'AndExpression': 
                return extractLogicalExpression.fromAndExpression(expression as AndExpression);
            case 'Negation': 
                return extractLogicalExpression.fromNegation(expression as Negation);
            case 'Group':
                return extractLogicalExpression.fromGroup(expression as Group);
            case 'Statement': 
                return extractLogicalExpression.fromStatement(expression as Statement);
        }
    }
}