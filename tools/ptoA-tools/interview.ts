import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";


/** Zod schema for LangChain tool-calling */
const InterviewQuestionSchema = z.object({
  title: z
    .string()
    .describe(
      'Very short label displayed as a chip/tag. Examples: "Auth method", "Library", "Approach".'
    ),
  description: z
    .string()
    .describe(
      'The complete question to ask the user. Should be clear, specific, and end with a question mark. If multiSelect is true, phrase it accordingly.'
    ),
  options: z
    .array(z.string())
    .min(2)
    .max(7)
    .describe(
      "The available choices (2-7). Distinct, mutually exclusive unless multiselect. No 'Other' option; it will be provided automatically."
    ),
  multiselect: z
    .boolean()
    .describe(
      "True to allow multiple selections. Use when choices are not mutually exclusive."
    ),
});

const InterviewInputSchema = z.object({
  questions: z
    .array(InterviewQuestionSchema)
    .min(1)
    .max(7)
    .describe(
      "2-7 structured, non-generic questions tailored to this user. Each question should reveal intent, priorities, constraints, or success criteria. Keep questions brief and provide context in the description field."
    ),
});

/** LangChain tool for asking the user clarification/questions (tool-calling). */
export const interviewTool = new DynamicStructuredTool({
  name: "interview_user",
  description:
    "Use this tool to ask the user for clarification or input on key design decisions. Provide 2-7 structured questions with 2-4 options each. Questions must be specific to the user's context and designed to uncover what they truly want (goals, constraints, tradeoffs, non-goals). Use when you need more information about the user's query of what exactly he meant or what exactly he wants to build.",
  schema: InterviewInputSchema,
  func: async (input): Promise<string> => {
    return JSON.stringify(input);
  },
});