"use server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { architectureModificationAgentPrompt, BASE_DEVILDEV_AGENT_PROMPT, DevilDevAgentAfterInterviewRole, DevilDevAgentBeforeInterviewRole } from "../prompts/dev/Chatbot";
import { deductCredits, getCredits } from "./credits";
import { minSoulsToSendMessage } from "../Limits";
import { interviewTool } from "../tools/ptoA-tools/interview";
import { generalResTool } from "../tools/ptoA-tools/general_res";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { TokenUsageCallbackHandler } from "../common/TokenUsageHandler";
import { TERMINATING_TOOLS, TerminatingTools } from "../types/pToA/tools";
import { tier1Tool } from "../tools/ptoA-tools/tier-1";
import { tier2Tool } from "../tools/ptoA-tools/tier-2";
import { updateArchitectureTool } from "../tools/ptoA-tools/update_architecture";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

// Return type for agent flow functions
export type AgentFlowResult = {
  textContent: string;
  remainingCredits?: number;
  deducted?: number;
};

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07" 
})

export async function chatbot(userInput: string, conversationHistory: any[] = [], userId: string | null = null, isInterviewed: boolean = false) {
    // Check credits before running the agent
    if (userId) {
        const creditsResult = await getCredits(userId);
        if (creditsResult.success && creditsResult.credits !== undefined && creditsResult.credits < minSoulsToSendMessage) {
            return { error: 'INSUFFICIENT_CREDITS', remainingCredits: creditsResult.credits };
        }
    }

    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const lastMessage = conversationHistory.length > 0
        ? `${conversationHistory[conversationHistory.length - 1].type === 'user' ? 'User' : 'Assistant'}: ${conversationHistory[conversationHistory.length - 1].content}`
        : "";

    const tools = [interviewTool, generalResTool, tier1Tool, tier2Tool];

    let systemRole = "";

    if(isInterviewed) {
        systemRole = DevilDevAgentAfterInterviewRole.replace("{interviewAnswers}", lastMessage || "(none)");
    } else {
        systemRole = DevilDevAgentBeforeInterviewRole;
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemRole + "\n" + BASE_DEVILDEV_AGENT_PROMPT],
      HumanMessagePromptTemplate.fromTemplate("{userInput}"),
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
        maxIterations: 10,
    });

    const inputs = {
        userInput,
        conversationHistory: formattedHistory,
      };

      const tokenUsageHandler = new TokenUsageCallbackHandler();
      
      // Use the executor's internal stream iterator to run step-by-step
      const stream = (agentExecutor as any)._streamIterator(inputs, { callbacks: [tokenUsageHandler] });
      
      let result: {output?: string, terminatingTool?: TerminatingTools} | undefined;
      
      for await (const step of stream) {
        if (!step) continue;
      
        // Agent finished normally (no more tool calls)
        if (step.output !== undefined) {
          result = { output: step.output, terminatingTool: step.terminatingTool };
          break;
        }
      
        // Check if the last tool call was a terminating tool
        const steps = step.intermediateSteps as Array<{ action: { tool: string }; observation: string }> | undefined;
        if (steps?.length) {
          const last = steps[steps.length - 1];
          const toolName = last?.action?.tool?.toLowerCase();
          if (toolName && TERMINATING_TOOLS.has(toolName)) {
            result = { output: last.observation, terminatingTool: toolName as TerminatingTools };
            break; 
          }
        }
      }

      console.log("Agent result:", result);
      const tokenUsage = tokenUsageHandler.getUsage();


    if (userId) {
        const inputTokens = tokenUsage.inputTokens;
        const outputTokens = tokenUsage.outputTokens;
        
        const creditResult = await deductCredits(userId, inputTokens, outputTokens, true);
        if (!creditResult.success) {
            console.error("Failed to deduct credits:", creditResult.error);
            return { response: result?.output };
        } else {
            console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
            return {
                response: result?.output,
                terminatingTool: result?.terminatingTool,
                remainingCredits: creditResult.remaining,
                deducted: creditResult.deducted
            };
        }
    }
    return { response: result?.output, terminatingTool: result?.terminatingTool };
}

export async function architectureModificationBot(userInput: string, conversationHistory: any[] = [], architectureData: any, userId: string | null = null) {
    // Check credits before running the agent
    if (userId) { 
        const creditsResult = await getCredits(userId);
        if (creditsResult.success && creditsResult.credits !== undefined && creditsResult.credits < minSoulsToSendMessage) {
            return { error: 'INSUFFICIENT_CREDITS', remainingCredits: creditsResult.credits };
        }
    }

    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg =>
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const get_architecture = new DynamicStructuredTool({
        name: "get_architecture",
        description:
            "Use this when you need to inspect the current architecture. It returns the full architecture JSON as a string. This does NOT close the agent.",
        schema: z.object({}),
        func: async (): Promise<string> => {
            return JSON.stringify(architectureData);
        },
    });

    const tools = [get_architecture, generalResTool, interviewTool, updateArchitectureTool];

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", architectureModificationAgentPrompt],
        HumanMessagePromptTemplate.fromTemplate("{userInput}"),
        new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createToolCallingAgent({ llm, tools, prompt });

    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: true,
        maxIterations: 10,
    });

    const inputs = {
        userInput,
        conversationHistory: formattedHistory,
    };

    const tokenUsageHandler = new TokenUsageCallbackHandler();

    const stream = (agentExecutor as any)._streamIterator(inputs, { callbacks: [tokenUsageHandler] });

    let result: { output?: string; terminatingTool?: TerminatingTools } | undefined;

    for await (const step of stream) {
        if (!step) continue;

        if (step.output !== undefined) {
            result = { output: step.output, terminatingTool: step.terminatingTool };
            break;
        }

        const steps = step.intermediateSteps as Array<{ action: { tool: string }; observation: string }> | undefined;
        if (steps?.length) {
            const last = steps[steps.length - 1];
            const toolName = last?.action?.tool?.toLowerCase();
            if (toolName && TERMINATING_TOOLS.has(toolName)) {
                result = { output: last.observation, terminatingTool: toolName as TerminatingTools };
                break;
            }
        }
    }

    console.log("architectureModificationBot result:", result);
    const tokenUsage = tokenUsageHandler.getUsage();

    if (userId) {
        const inputTokens = tokenUsage.inputTokens;
        const outputTokens = tokenUsage.outputTokens;

        const creditResult = await deductCredits(userId, inputTokens, outputTokens, true);
        if (!creditResult.success) {
            console.error("Failed to deduct credits:", creditResult.error);
            return { response: result?.output, terminatingTool: result?.terminatingTool };
        } else {
            console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
            return {
                response: result?.output,
                terminatingTool: result?.terminatingTool,
                remainingCredits: creditResult.remaining,
                deducted: creditResult.deducted
            };
        }
    }

    return { response: result?.output, terminatingTool: result?.terminatingTool };
}