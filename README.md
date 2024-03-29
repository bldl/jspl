# JavaScript Propositional Laboratory
Provides support for the JavaScript Propositional Laboratory Format (JSPL), a format developed for Ecma-/JS-Developers, to be used for discussing contentious features of proposals.

Based on [Langium](https://langium.org)

## Getting started

## Laboratory Information
```
laboratory {
    title "The title of the generated laboratory"
    description "This laboratory is for x"
    icon "./path/to/favicon.svg or some url" 
    format MD
    author "Philipp Riemer"
    version "1.0"
}
```

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
        message "this is disabled, because ..." when someCondition is True and someOtherProposition is "undefined"
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

## Markdown support
Multiline strings (laboratory description, concern description) are by default interpreted as markdown. Because markdown is indentation-sensitive, it is important to always indent the descriptions to the level of the original node. This following example of a concern is correctly indented:
```
concern test {
    summary "CONCERN!"
    description "
    
    # This is concerning.
            
    **Very concerning!** 

    *Or is it?*

        \{
            int i = 0;
            i++;
            return i;
        \}
    "
}
```

The usage of markdown can be disabled in favour of direct html-interpretation on a per-description basis by prefixing a string with "HTML":
```
concern test {
    summary "summary"
    description HTML "
        <p>This is my concern</p>
    "
}
```