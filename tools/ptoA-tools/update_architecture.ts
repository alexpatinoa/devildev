import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

/** Zod schema for update_architecture tool (when the user wants to modify an existing architecture). */
const UpdateArchitectureSchema = z.object({
    response: z
        .string()
        .describe(
            "The message to show to the user acknowledging their request to update the architecture and summarizing at a high level what will be done next."
        ),
    changeRequirement: z
        .string()
        .describe(
            "A clear, structured description of the requested architecture changes. This should list the concrete modifications, additions, or removals needed in the current architecture so that the next agent can apply them."
        ),
});

/** LangChain tool for packaging user requests to update the existing architecture. */
export const updateArchitectureTool = new DynamicStructuredTool({
    name: "update_architecture",
    description:
        "Use this tool when the user explicitly wants to update or modify an already generated architecture (e.g., changing components, flows, technologies, or constraints). It provides a user-facing response and a detailed changeRequirement payload for the architecture-update agent.",
    schema: UpdateArchitectureSchema,
    func: async (input): Promise<string> => {
        return JSON.stringify(input);
    },
});

