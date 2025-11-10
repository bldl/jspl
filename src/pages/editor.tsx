import * as vscode from "vscode";
import * as monaco from "@codingame/monaco-vscode-editor-api";

import { useMemo, useState } from "react";
import { fromThrowable } from "neverthrow";

import { Button, Code, Divider, Group, NumberInput, ScrollArea, Stack, Tabs, Text } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";

import { vscodeConfig } from "../utils/monaco";
import { LanguageClientConfig } from "monaco-languageclient/lcwrapper";

import { Lab } from "../components/lab";
import { Laboratory, parseLaboratory } from "../parser";

import exampleCode from "../../examples/in/records_and_tuples.spa?raw";
import { IconBolt, IconBrain, IconBug, IconScale } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { makeInput } from "../solver/utils";
import { ObjectInspector } from "react-inspector";

import Solver from "../../solver/wasm/loader";

const setLocalStorage = fromThrowable((key: string, value: string) => localStorage.setItem(key, value), e => e);
const solver = await Solver();

function Optimizer({ laboratory, notify }: { laboratory: Laboratory; notify: () => void })
{
    const [weights, setWeights] = useState(
        new Map(
            laboratory.concerns.values().map(concern => [concern.name, 1 as number] as const),
        ),
    );

    const input = useMemo(() => makeInput(laboratory, weights), [laboratory, weights]);

    const update = (name: string, value: number) =>
    {
        weights.set(name, value);
        setWeights(new Map(weights));
    };

    return (
        <Stack>
            <Tabs defaultValue="weights">
                <Tabs.List>
                    <Tabs.Tab value="weights" leftSection={<IconScale />}>Weights</Tabs.Tab>
                    <Tabs.Tab value="Debug" leftSection={<IconBug />}>Debug</Tabs.Tab>
                </Tabs.List>

                <ScrollArea h="50vh">
                    <Tabs.Panel value="weights">
                        <Stack p="md">
                            {weights.entries().map(([name, value]) => (
                                <Group wrap="nowrap">
                                    <NumberInput
                                        w={75}
                                        min={0}
                                        value={value}
                                        onChange={value => update(name, value as number)}
                                    />
                                    <Text truncate="end">
                                        {name}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="Debug">
                        <Stack p="md">
                            <Divider label="Inspector" />
                            <ObjectInspector theme="chromeDark" data={input} />
                            <Divider label="Objective" />
                            <Code block>{input.input.objective}</Code>
                            <Divider label="Constraints" />
                            <Code block>{input.input.constraints.join("\n")}</Code>
                        </Stack>
                    </Tabs.Panel>
                </ScrollArea>
            </Tabs>
            <Group justify="end">
                <Button
                    leftSection={<IconBolt size={16} />}
                    onClick={() =>
                    {
                        const constraints = new solver.VecString();

                        for (const constraint of input.input.constraints)
                        {
                            constraints.push_back(constraint);
                        }

                        const variables = new solver.VecString();

                        for (const variable of input.input.variables)
                        {
                            variables.push_back(variable);
                        }

                        const solution = solver.solve({
                            objective: input.input.objective,
                            variables,
                            constraints,
                        });

                        if (!solution.success)
                        {
                            return;
                        }

                        const keys = solution.variables.keys();

                        for (let i = 0; keys.size() > i; ++i)
                        {
                            const key = keys.get(i)!;

                            if (!key.startsWith("x"))
                            {
                                continue;
                            }

                            const variable = solution.variables.get(key)!;

                            if (!variable)
                            {
                                continue;
                            }

                            const [tweakable, mapping] = [...input.mappings.propositions.entries()].find(
                                mapping => [...mapping[1].values()].includes(key),
                            )!;

                            const value = mapping.entries().find(x => x[1] === key)![0];
                            const tweak = laboratory.tweakables.find(x => x.name === tweakable)!;

                            tweak.update(value);

                            notify();
                        }
                    }}
                >
                    Done
                </Button>
            </Group>
        </Stack>
    );
}

export default function({ languageConfig }: { languageConfig: LanguageClientConfig })
{
    const [current, setCurrent] = useState<Laboratory | undefined>();

    const save = useDebouncedCallback(setLocalStorage, 1000);
    const lastDraft = localStorage.getItem("draft") || exampleCode;

    const change = async (input: string) =>
    {
        save("draft", input);
        parseLaboratory(input).then(result => result.andTee(setCurrent));
    };

    return (
        <Group wrap="nowrap" className="main">
            <MonacoEditorReactComp
                vscodeApiConfig={vscodeConfig}
                languageClientConfig={languageConfig}
                className="editor"
                onVscodeApiInitDone={() =>
                {
                    change(lastDraft);
                    vscode.workspace.onDidChangeTextDocument(async ({ document }) => change(document.getText()));
                }}
                onEditorStartDone={app =>
                {
                    app?.getEditor()?.setModel(monaco.editor.createModel(lastDraft, "specalt"));
                }}
            />
            <Stack w="50%" h="100%">
                <Lab
                    w="100%"
                    h="calc(100% - 3.5rem)"
                    laboratory={current}
                />
                <Group justify="end">
                    <Button
                        leftSection={<IconBrain size={16} />}
                        onClick={() =>
                            modals.open({
                                centered: true,
                                children: (
                                    <Optimizer
                                        laboratory={current!}
                                        notify={() => setCurrent({ ...current! })}
                                    />
                                ),
                            })}
                    >
                        Optimize
                    </Button>
                </Group>
            </Stack>
        </Group>
    );
}
