import { EmbindModule } from "./solver"; // < Generated when solver is compiled

declare global
{
    const Module: EmscriptenModule;
}

export default function(path = "solver.js")
{
    return new Promise<EmbindModule>((resolve, reject) =>
    {
        const script = document.createElement("script");

        script.onload = () =>
        {
            if (!Module)
            {
                return reject("Module not available. Did the WASM module load properly?");
            }

            Module.onRuntimeInitialized = () =>
            {
                resolve(Module as unknown as EmbindModule);
            };
        };

        script.onerror = (event, source) =>
        {
            reject(`Failed to load script (${event}): ${source}`);
        };

        script.src = path;

        document.head.appendChild(script);
    });
}
