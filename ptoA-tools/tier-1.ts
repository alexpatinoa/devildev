import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

/** Zod schema for tier_1 tool (for ideas that can be bootstrapped with no-code). */
const Tier1Schema = z.object({
    response: z
        .string()
        .describe(
            "The message to show to the user explaining why they don't need a custom architecture. For example: 'Bruh... there is no need to create architecture for this idea. You can simply copy-paste this prompt below in lovable or bolt'"
        ),
    prompt: z
        .string()
        .describe(
            "A proper, detailed prompt that the user can copy and paste into a no-code coding platform (like Lovable or Bolt) with all necessary details to build their idea."
        ),
});

/** LangChain tool for suggesting no-code platforms for simple ideas. */
export const tier1Tool = new DynamicStructuredTool({
    name: "tier_1",
    description:
        "Use this tool if the user's project idea could be reasonably bootstrapped with a no-code AI coding platform (like Lovable, Bolt, v0, etc.). This tool gives them a response explaining this and provides a comprehensive prompt they can use there.",
    schema: Tier1Schema,
    func: async (input): Promise<string> => {
        return JSON.stringify(input);
    },
});
