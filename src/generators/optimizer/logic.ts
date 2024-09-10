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
    fromStatement: function (expression: Statement): LStatement {
        let ref = expression.reference.ref;
        // type cant really be undefined here unless there is a syntactical mistake in the input, then crashing is okay...
        if (ref?.$type === undefined) {
            throw new Error("Can't resolve references correctly.");
        } else if (ref?.$type === "Proposition") {   
            return {
                type: "statement",
                proposition: ref.name,
                value: expression.value
            }
        } else {
            return extractLogicalExpression.fromExpression(ref.condition.expression);
        }
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