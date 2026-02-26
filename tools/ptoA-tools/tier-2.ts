import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

/** Zod schema for tier_2 tool (for ideas requiring deep research and custom architecture). */
const Tier2Schema = z.object({
    response: z
        .string()
        .describe(
            "The message to show to the user confirming that their idea is complex and will require deep research, custom architecture generation, and planning. For example: 'This is a solid idea that needs proper architecture and research. I am sending the details to our research agent to generate a comprehensive plan.'"
        ),
    context: z
        .string()
        .describe(
            "The comprehensive context to send to the next agent (research/architecture agent). This must contain all gathered requirements, constraints, and necessary details to research the idea deeply."
        ),
});

/** LangChain tool for transitioning complex user ideas to the research and architecture phase. */
export const tier2Tool = new DynamicStructuredTool({
    name: "tier_2",
    description:
        "Use this tool when the user's project idea is complex, requires custom architecture, and cannot simply be bootstrapped with no-code tools. This tool provides a confirmation response to the user and packages the project details as context for the next agent.",
    schema: Tier2Schema,
    func: async (input): Promise<string> => {
        return JSON.stringify(input);
    },
});
