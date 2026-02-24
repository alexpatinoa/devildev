import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

/** Zod schema for general response tool (user asked a general question or typed something random). */
const GeneralResponseSchema = z.object({
  response: z
    .string()
    .describe(
      "The reply to the user's general question, query, or random input. Should be helpful and conversational."
    ),
});

/** LangChain tool for responding to general questions or random user input (tool-calling). */
export const generalResTool = new DynamicStructuredTool({
  name: "general_response",
  description:
    "Use this tool when the user asks a general question, makes a general query, or types something random that does not require building or designing something. Use for small talk, greetings, clarifications about the assistant, or off-topic messages.",
  schema: GeneralResponseSchema,
  func: async (input): Promise<string> => {
    return JSON.stringify(input);
  },
});
