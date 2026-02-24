"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createParallelWebSearchTool } from "../tools/parallel";
import { TokenUsageCallbackHandler } from "../common/TokenUsageHandler";
import { STACK_OPTIONS_PROMPT } from "../prompts/StackOptions";
import { deductCredits, getCredits } from "./credits";
import { minSoulsToSendMessage } from "../Limits";

const StackOptionsSchema = z.object({
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        technology: z.string().min(1),
        pros: z.array(z.string().min(1)).min(3).max(6),
        cons: z.array(z.string().min(1)).min(2).max(5),
      })
    )
    .min(1)
    .max(5),
});

const sanitizeJsonString = (jsonString: string): string => {
  let cleaned = jsonString
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return cleaned;
};

const safeJsonParse = (jsonString: string): any => {
  const sanitized = sanitizeJsonString(jsonString);
  try {
    return JSON.parse(sanitized);
  } catch (error) {
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw error;
  }
};

export async function createArchOptionsFromTier2(chatId: string, tier2Context: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const creditsResult = await getCredits(userId);
    if (
      creditsResult.success &&
      creditsResult.credits !== undefined &&
      creditsResult.credits < minSoulsToSendMessage
    ) {
      return { error: "INSUFFICIENT_CREDITS", remainingCredits: creditsResult.credits };
    }

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "gpt-5-nano-2025-08-07",
    });

    const tools = [createParallelWebSearchTool()];
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", STACK_OPTIONS_PROMPT],
      ["user", "Requirement:\n{requirement}\n\nReturn JSON only."],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 6,
    });

    const tokenUsageHandler = new TokenUsageCallbackHandler();
    const result = await agentExecutor.invoke(
      { requirement: tier2Context },
      { callbacks: [tokenUsageHandler] }
    );

    const output = typeof result?.output === "string" ? result.output : "";
    const parsed = StackOptionsSchema.parse(safeJsonParse(output));

    const options = parsed.options.map((option) => ({
      name: option.name.trim(),
      description: option.description.trim(),
      technology: option.technology.trim(),
      pros: option.pros.map((pro) => pro.trim()),
      cons: option.cons.map((con) => con.trim()),
    }));

    const archOptions = await db.archOptions.create({
      data: {
        chatId,
        requirement: tier2Context,
        stacks: {
          create: options,
        },
      },
      include: {
        stacks: true,
      },
    });

    const tokenUsage = tokenUsageHandler.getUsage();
    const creditResult = await deductCredits(
      userId,
      tokenUsage.inputTokens,
      tokenUsage.outputTokens,
      true
    );

    revalidatePath(`/dev/${chatId}`);

    if (!creditResult.success) {
      console.error("Failed to deduct credits:", creditResult.error);
      return { success: true, archOptions };
    }

    return {
      success: true,
      archOptions,
      remainingCredits: creditResult.remaining,
      deducted: creditResult.deducted,
    };
  } catch (error) {
    console.error("Error creating arch options:", error);
    return { success: false, error: "Failed to create arch options" };
  }
}

export async function getLatestArchOptions(chatId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    const archOptions = await db.archOptions.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      include: { stacks: true },
    });

    return { success: true, archOptions };
  } catch (error) {
    console.error("Error getting latest arch options:", error);
    return { success: false, error: "Failed to get arch options" };
  }
}
