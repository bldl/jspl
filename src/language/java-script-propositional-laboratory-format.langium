grammar JavaScriptPropositionalLaboratoryFormat

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

terminal BOOLEAN returns boolean: /True|False/;
terminal ML_STRING_FORMAT returns string: /MD|HTML/;
terminal ID: /[_a-zA-Z][\w_]*/;
//terminal INT returns number: /[0-9]+/;
//terminal CODE_STRING: /`(\\.|[^`\\])*`/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

FormattedString:
    (format=ML_STRING_FORMAT)? contents=STRING
;


LaboratoryInformation:
    "laboratory" "{" 
        ( // allow only one field to be used multiple times via validators
            ("title" titles+=STRING)
            | ("description" descriptions+=FormattedString)
            | ("icon" icons+=STRING)
            | ("format" formats+=ML_STRING_FORMAT)
            | ("author" authors+=STRING)
            | ("version" versions+=STRING)
        )*
    "}"
;

// Concerns
Concern:
    "concern" name=ID "{"
        "summary" summary=STRING
        "description" description=FormattedString
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
    "proposition" name=ID "{"
        "expression" expression=STRING
        //"default" valueDescription+=ValueDescription // how can I get this value to also show up in the list of ALL value descriptions?
        (valueClauses+=ValueClause)+
        (disable=DisableClause)?
    "}"
;