# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2024-04-05

- Added Graphviz-Generator to generate graph visualisation
- Added JSON-Generator to generate json format for serialization

## [0.5.4] - 2024-04-04

- Added validator to check, that in every statement made, the referenced object actual can have the given value.
- Fixed some validation errors, caused by accessing fields of possibly undefined objects.

## [0.5.3] - 2024-04-01

- Fixed minor validation errors

## [0.5.2] - 2024-04-01

- Updated the webpage generator, to not use default values, when certain information is not given. Instead the blocks displaying this information are removed from the webpage. These include: `icon`, `author` and `version`. `title` and `description` will still display default values, when not specified.

## [0.5.0] - 2024-03-29

- Updated `laboratory`-field to include the following (sub-)fields:
    - `format`: specifies the default format to be used in description texts.
    - `author`: specifies the author of the laboratory.
    - `version`: specifies the version number of the laboratory.

## [0.4.0] - 2024-03-25
 
- Added warnings for unused concerns and conditions
- Added `laboratory`-field to the top of documents to specify information for the laboratory. Supported (sub-)fields:
    - `title`: Specify a title to be displayed on the top of the laboratory.
    - `description`: Specify a description text to be displayed on the top of the laboratory.
    - `icon`: Specify an icon for the laboratory (e.g. favicon for browsers). This is a string, that will be copied straight to the html. Therefore this can be a local path to an image or a web-url.
- Added Markdown support:
    - `description` fields are now formatted in Markdown by default
    - HTML-Formatting can be specified per `description` by putting `HTML` before the string
    