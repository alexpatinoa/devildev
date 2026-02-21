"use server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { architectureModificationPrompt, DEVILDEV_AGENT_PROMPT } from "../prompts/Chatbot";
import { deductCredits, getCredits } from "./credits";
import { minSoulsToSendMessage } from "../Limits";
import { extractTextContent } from "@/lib/ai/extractTextContent";
import { interviewTool } from "../ptoA-tools/interview";
import { generalResTool } from "../ptoA-tools/general_res";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { TokenUsageCallbackHandler } from "../common/TokenUsageHandler";
import { TERMINATING_TOOLS, TerminatingTools } from "../types/pToA/tools";

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



export async function chatbot(userInput: string, conversationHistory: any[] = [], userId: string | null = null) {
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

    const tools = [interviewTool, generalResTool];

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", DEVILDEV_AGENT_PROMPT],
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

    const template = architectureModificationPrompt;

    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm);
    const result = await chain.invoke({
        userInput: userInput,
        conversationHistory: formattedHistory,
        architecture_data: JSON.stringify(architectureData)
    });
    
    // Extract text content - handle both string and complex content types
    const textContent = extractTextContent(result.content);
    
    // Deduct credits if userId is provided
    if (userId) {
        const inputTokens = result.usage_metadata?.input_tokens ?? 0;
        const outputTokens = result.usage_metadata?.output_tokens ?? 0;
        
        const creditResult = await deductCredits(userId, inputTokens, outputTokens);
        if (!creditResult.success) {
            console.error("Failed to deduct credits:", creditResult.error);
            return { textContent };
        } else {
            console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
            return {
                textContent,
                remainingCredits: creditResult.remaining,
                deducted: creditResult.deducted
            };
        }
    }
    
    return { textContent };
}