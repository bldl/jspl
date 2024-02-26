# JavaScript Propositional Laboratory

## Getting started

## Concerns
```
concern name {
    summary "a short summary"
    description "a more detailed description of the concern, possibly containing html elements."
}
```

## Proposition
```
proposition name {
    expression "what Expression to display"
    default value True
    value False {
        raise someConcern when someCondition is True
    }
    value "some custom value"
    disabled {
        throw "message" when someCondition is True and someOtherProposition is "undefined"
    }
}

proposition given {
    expression "this is given"
    value True
}
```

## Conditions
```
condition name holds when someProposition is "value1" and someOtherCondition is False
```