# Changelog

All notable changes to this project will be documented in this file.

## [0.7.4] - 2025-04-21

- Updated Optimizer Template to include local version of HTM-Preact instead of loading it through unpkg.com

## [0.7.3] - 2025-02-28

- Allowed for uncapitalised boolean values (true/false and True/False are now all allowed)
- Updated examples to reflect scientific work

## [0.7.2] - 2025-02-10

- Changed `proposition` keyword to `tweakable` 
- Changed `concern` keyword to `issue`

## [0.7.1] - 2025-01-15

- Minor fixes to optimizer
- Tried removing some unnecessary files from extension

## [0.7.0] - 2025-01-15

- Added experimental Optimizer webpage.
    - Requires to run a local python server running a linear programming solver. A suitable server using the SCIP Solver can be found in the Git repository. (Actually using the solver locally might require the user to disable Cors-checks)

## [0.6.3] - 2024-04-28

- Repository was moved over to GitHub under the Bergen Language Design Laboratory

- Fixes:
    - Fixed issue where single quotes were escaped in JSON-Representation. (This is considered an error in json...)

## [0.6.2] - 2024-04-25

- Fixes:
    - Fixed validation error, where all boolean values for referenced conditions were rejected, instead of accepted.

## [0.6.1] - 2024-04-12

- Web Laboratory Fixes:
    - Removed unnecessary LICENSE and README from template
        - (They might be readded in the future, with the README containing the lab description and the LICENSE using the author name.)

- JSON Generator Fixes/Improvements:
    - Added missing `default` field to values of propositions
    - Shortened empty lists to reduce unused space in output

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
    