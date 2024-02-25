/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { DefaultSharedModuleContext } from '../default-module.js';
import type { Module } from '../dependency-injection.js';
import type { LangiumServices, LangiumSharedServices, PartialLangiumServices, PartialLangiumSharedServices } from '../services.js';
import { LangiumGrammarValidator } from './validation/validator.js';
import { LangiumGrammarValidationResourcesCollector } from './validation/validation-resources-collector.js';
import { LangiumGrammarTypesValidator } from './validation/types-validator.js';
export type LangiumGrammarAddedServices = {
    validation: {
        LangiumGrammarValidator: LangiumGrammarValidator;
        ValidationResourcesCollector: LangiumGrammarValidationResourcesCollector;
        LangiumGrammarTypesValidator: LangiumGrammarTypesValidator;
    };
};
export type LangiumGrammarServices = LangiumServices & LangiumGrammarAddedServices;
export declare const LangiumGrammarModule: Module<LangiumGrammarServices, PartialLangiumServices & LangiumGrammarAddedServices>;
export declare function createLangiumGrammarServices(context: DefaultSharedModuleContext, sharedModule?: Module<LangiumSharedServices, PartialLangiumSharedServices>): {
    shared: LangiumSharedServices;
    grammar: LangiumGrammarServices;
};
//# sourceMappingURL=langium-grammar-module.d.ts.map