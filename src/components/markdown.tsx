import { Code } from "@mantine/core";
import Markdown_, { Options } from "react-markdown";

export default function Markdown(props: Omit<Options, "components">)
{
    return (
        <Markdown_
            components={{
                code({ className, children })
                {
                    return <Code className={className}>{children}</Code>;
                },
            }}
            {...props}
        />
    );
}
