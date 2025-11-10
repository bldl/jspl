import { Result } from "neverthrow";
import { Diagnostic } from "vscode-languageserver";

export type Res<T> = Result<T, Diagnostic[]>;
