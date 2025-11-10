import ReactDOM from "react-dom/client";

import "./style/index.css";
import "@mantine/core/styles.css";

import { IconBrandGithub, IconTestPipe } from "@tabler/icons-react";
import { ActionIcon, AppShell, Group, MantineProvider, Text } from "@mantine/core";

import Editor from "./pages/editor.tsx";
import { initMonaco } from "./utils/monaco.ts";
import { ModalsProvider } from "@mantine/modals";

const languageConfig = await initMonaco();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <MantineProvider theme={{ primaryColor: "violet", defaultRadius: "md" }} forceColorScheme="dark">
        <ModalsProvider>
            <AppShell padding="md" header={{ height: 60 }}>
                <AppShell.Header>
                    <Group wrap="nowrap" justify="space-between" h="100%" px="md">
                        <Group wrap="nowrap" gap="xs">
                            <IconTestPipe />
                            <Text fw="bolder">
                                SpecAlt
                            </Text>
                            <Text c="dimmed" fs="italic" visibleFrom="md">
                                - The JavaScript Proposal Laboratory
                            </Text>
                        </Group>
                        <Group>
                            <ActionIcon
                                component="a"
                                href="https://github.com/bldl/specalt-web"
                                target="_blank"
                                variant="light"
                            >
                                <IconBrandGithub size={16} />
                            </ActionIcon>
                        </Group>
                    </Group>
                </AppShell.Header>
                <AppShell.Main>
                    <Editor languageConfig={languageConfig} />
                </AppShell.Main>
            </AppShell>
        </ModalsProvider>
    </MantineProvider>,
);
