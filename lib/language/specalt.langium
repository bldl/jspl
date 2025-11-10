grammar SpecAltFormat

entry Model:
    ( // Optional Header
        laboratory=LaboratoryInformation
    )?
    ( // Main Body
        concerns+=Concern 
        | conditions+=Condition 
        | propositions+=Proposition
    )*
;

// Terminals

terminal BOOLEAN returns boolean: /True|False|true|false/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

LaboratoryInformation:
    "laboratory" "{" 
        ( // allow only one field to be used multiple times via validators
            ("title" title=STRING)
            | ("description" description=STRING)
            | ("author" authors+=STRING)
            | ("version" version=STRING)
        )*
    "}"
;

// Concerns
Concern:
    "issue" name=ID "{"
        "summary" summary=STRING
        "description" description=STRING
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
    reference=[Referenceable:ID] "is" (negation?="not")? value=(BOOLEAN | STRING)
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
    "raise" concern=[Concern:ID] (condition=WhenCondition)?
;

ValueClause:
    (default?="default")? "value" value=(BOOLEAN | STRING) ("{" 
        (raises+=RaisingConcern)* 
    "}")?
;

DisableStatement:
    "message" (message=STRING) (condition=WhenCondition)
;

DisableClause:
    "disabled" "{"
        (statements+=DisableStatement)*
    "}" 
;

Proposition:
    "tweakable" name=ID "{"
        "expression" expression=STRING
        (valueClauses+=ValueClause)+
        (disable=DisableClause)?
    "}"
;
