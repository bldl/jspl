import {
    createDefaultModule,
    createDefaultSharedModule,
    type DefaultSharedModuleContext,
    inject,
    type LangiumServices,
    type LangiumSharedServices,
    type Module,
    type PartialLangiumServices,
} from "langium";

import { SpecAltFormatGeneratedModule, SpecAltGeneratedSharedModule } from "./generated/module";
import { registerValidationChecks, SpecAltFormatValidator } from "./specalt-validator";
import { SpecAltValueConverter } from "./specalt-converter";

export type SpecAltFormatAddedServices = {
    validation: {
        SpecAltFormatValidator: SpecAltFormatValidator;
    };
};

export type SpecAltFormatServices =
    & LangiumServices
    & SpecAltFormatAddedServices;

export const SpecAltFormatModule: Module<
    SpecAltFormatServices,
    PartialLangiumServices & SpecAltFormatAddedServices
> = {
    validation: {
        SpecAltFormatValidator: () => new SpecAltFormatValidator(),
    },
    parser: {
        ValueConverter: () => new SpecAltValueConverter(),
    },
};

export function createSpecAltFormatServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    SpecAltFormat: SpecAltFormatServices;
}
{
    const shared = inject(
        createDefaultSharedModule(context),
        SpecAltGeneratedSharedModule,
    );

    const SpecAltFormat = inject(
        createDefaultModule({ shared }),
        SpecAltFormatGeneratedModule,
        SpecAltFormatModule,
    );

    shared.ServiceRegistry.register(SpecAltFormat);
    registerValidationChecks(SpecAltFormat);

    return { shared, SpecAltFormat };
}
