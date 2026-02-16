"use server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { architectureModificationPrompt, chatbotPrompt } from "../prompts/Chatbot";
import { deductCredits } from "./credits";

// Return type for agent flow functions
export type AgentFlowResult = {
  textContent: string;
  remainingCredits?: number;
  deducted?: number;
};

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07" // You can change this to any OpenAI model like "gpt-3.5-turbo", "gpt-4-turbo", etc.
})
const llm2 = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-mini-2025-08-07"
})

const tool = {"type": "web_search_preview"}

const llmWithWeb = llm2.bindTools([tool])



export async function chatbot(userInput: string, conversationHistory: any[] = [], userId: string | null = null) {
    ;

    const template = chatbotPrompt;

    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llmWithWeb);
    const result = await chain.invoke({
        userInput: userInput,
        conversationHistory: formattedHistory
    });
    console.log("chatbot result:", result);
    
    // Extract text content - handle both string and complex content types
    let textContent: string;
    if (typeof result.content === 'string') {
        textContent = result.content;
    } else if (Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0];
        if (typeof firstContent === 'string') {
            textContent = firstContent;
        } else if (typeof firstContent === 'object' && 'text' in firstContent) {
            textContent = firstContent.text as string;
        } else {
            textContent = JSON.stringify(firstContent);
        }
    } else {
        textContent = JSON.stringify(result.content);
    }
    
    console.log("textContent:", textContent);
    
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

export async function architectureModificationBot(userInput: string, conversationHistory: any[] = [], architectureData: any, userId: string | null = null) {
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
    let textContent: string;
    if (typeof result.content === 'string') {
        textContent = result.content;
    } else if (Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0];
        if (typeof firstContent === 'string') {
            textContent = firstContent;
        } else if (typeof firstContent === 'object' && 'text' in firstContent) {
            textContent = firstContent.text as string;
        } else {
            textContent = JSON.stringify(firstContent);
        }
    } else {
        textContent = JSON.stringify(result.content);
    }
    
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