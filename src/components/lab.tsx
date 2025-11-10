import { ChangeEvent, useState } from "react";

import Markdown from "../components/markdown";
import { IconAlertTriangle } from "@tabler/icons-react";

import {
    Accordion,
    Badge,
    Card,
    CardProps,
    Code,
    Group,
    NativeSelect,
    rem,
    ScrollArea,
    Stack,
    StackProps,
    Switch,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";

import { evaluate } from "../parser/utils";
import { Given, Laboratory, Tweakable } from "../parser";

export interface ItemProps extends Omit<CardProps, "withBorder">
{
    item: Tweakable | Given;
    notify?: () => void;
}

export function Item({ item, notify, ...props }: ItemProps)
{
    const { expression, value } = item;

    const disable = "disable" in item ? evaluate(item.disable) : true;
    const concerns = "concerns" in item ? evaluate(item.concerns) : [];

    const allowedValues = "allowedValues" in item ? item.allowedValues : [item.value];
    const boolish = allowedValues.every(item => typeof item === "boolean");

    const update = ({ currentTarget }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    {
        if ("update" in item)
        {
            item.update("checked" in currentTarget ? currentTarget.checked : currentTarget.value);
        }

        notify?.();
    };

    return (
        <Card withBorder {...props}>
            <Stack>
                <Group wrap="nowrap" justify="space-between">
                    <Code>
                        {expression}
                    </Code>
                    {boolish
                        ? (
                            <Switch
                                onChange={update}
                                disabled={disable}
                                checked={evaluate(value) as boolean}
                            />
                        )
                        : (
                            <NativeSelect
                                onChange={update}
                                disabled={disable}
                                data={allowedValues as string[]}
                                value={evaluate(value) as string}
                            />
                        )}
                </Group>
                {concerns.length > 0
                    && (
                        <Accordion px="xs" variant="filled">
                            {concerns.map(concern => (
                                <Accordion.Item key={concern.name} value={concern.name}>
                                    <Accordion.Control
                                        px={0}
                                        icon={
                                            <ThemeIcon size="sm" c="orange" variant="transparent">
                                                <IconAlertTriangle />
                                            </ThemeIcon>
                                        }
                                    >
                                        <Text size="sm" c="orange">
                                            {concern.summary}
                                        </Text>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Markdown>
                                            {concern.description}
                                        </Markdown>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    )}
            </Stack>
        </Card>
    );
}

export interface LabProps extends Omit<StackProps, "align">
{
    laboratory?: Laboratory;
}

export function Lab({ laboratory, ...props }: LabProps)
{
    if (!laboratory)
    {
        return <></>;
    }

    const [ver, setVer] = useState(0);
    const { title, authors, description, tweakables, givens } = laboratory;

    return (
        <Stack align="center" {...props}>
            {title && <Title>{title}</Title>}
            <Group wrap="nowrap">
                {authors?.map(author => <Badge mih={rem(25)} key={author}>{author}</Badge>)}
            </Group>
            {description && <Markdown>{description}</Markdown>}
            <ScrollArea w="100%">
                <Stack align="center" key={ver}>
                    {givens.map(given => (
                        <Item
                            w="90%"
                            item={given}
                            key={given.expression}
                        />
                    ))}
                    {tweakables.map(tweakable => (
                        <Item
                            w="90%"
                            item={tweakable}
                            key={tweakable.expression}
                            notify={() => setVer(ver + 1)}
                        />
                    ))}
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
