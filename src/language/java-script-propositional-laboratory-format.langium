grammar JavaScriptPropositionalLaboratoryFormat

entry Model:
    (concerns+=Concern | conditions+=Condition | propositions+=Proposition)*;

// Concerns

Concern:
    "concern" name=ID "{"
        "summary" summary=STRING
        "description" description=STRING
        //"assumes_using" assumes="==="
    "}"
;

// Expressions

PropositionalExpression : OrExpression;
OrExpression infers PropositionalExpression : AndExpression ({infer OrExpression.left=current} "or" right=AndExpression)*;
AndExpression infers PropositionalExpression : UnaryExpression ({infer AndExpression.left=current} "and" right=UnaryExpression)* ;

UnaryExpression infers PropositionalExpression: Statement | Negation | Group;
Negation: "not" inner=PropositionalExpression;
Group: "(" inner=PropositionalExpression ")";

Referenceable: Condition | Proposition;
Statement: 
    reference=[Referenceable] "is" (negation?="not")? value=(BOOLEAN | STRING)
;

WhenCondition: 
    "when" expression=PropositionalExpression
;

// Conditions

Condition:
    "condition" name=ID "holds" condition=WhenCondition
;

// Propositions

RaisingConcern:
    "raise" concern=[Concern] (condition=WhenCondition)?
;

ValueClause:
    (default?="default")? "value" value=(BOOLEAN | STRING) ("{" 
        (raises+=RaisingConcern)* 
    "}")?
;

DisableStatement:
    "throw" (message=STRING) (condition=WhenCondition)
;

DisableClause:
    "disabled" "{"
        (statements+=DisableStatement)*
    "}" 
;

Proposition:
    "proposition" name=ID "{"
        "expression" expression=STRING
        //"default" valueDescription+=ValueDescription // how can I get this value to also show up in the list of ALL value descriptions?
        (valueClauses+=ValueClause)+
        (disable=DisableClause)?
    "}"
;

// Terminals

hidden terminal WS: /\s+/;
terminal BOOLEAN returns boolean: /True|False/;
terminal ID: /[_a-zA-Z][\w_]*/;
//terminal INT returns number: /[0-9]+/;
//terminal CODE_STRING: /`(\\.|[^`\\])*`/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;