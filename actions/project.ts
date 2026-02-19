"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { ultraProjectChatBotPrompt, projectChatBotBugPrompt, projectChatBotTaskPrompt, projectChatBotFeaturePrompt } from "../prompts/ReverseArchitecture";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { searchCodeTool, getFileContentTool } from "./github/gitTools";
import { getInstallationToken } from "./githubAppAuth";
import { extractTextContent } from "@/lib/ai/extractTextContent";
import Parallel from "parallel-web";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { deductCredits } from "./credits";
const openaiKey = process.env.OPENAI_API_KEY;
const parallelApiKey = process.env.PARALLEL_API_KEY;

const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-mini-2025-08-07" 
})

const llm2 = new ChatOpenAI({ 
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07"
})
const tool = {"type": "web_search_preview"}
const llmWithWeb = llm2.bindTools([tool])

// Output schema for createPactProjectChatBot
const pactOutputSchema = {
  type: "object",
  description: "Structured output containing a short response and pact details",
  properties: {
    shortResponse: {
      type: "string",
      description: "A concise response under 200 words explaining the analysis and recommendations"
    },
    pact: {
      type: "object",
      description: "The pact details with title and body",
      properties: {
        title: {
          type: "string",
          description: "Clear, actionable pact title"
        },
        body: {
          type: "string",
          description: "Detailed pact description in markdown format with context, approach, acceptance criteria, and code references"
        }
      },
      required: ["title", "body"]
    }
  },
  required: ["shortResponse", "pact"]
};

// Parallel Web Search Tool
const createParallelWebSearchTool = () => {
  const parallelClient = new Parallel({ apiKey: parallelApiKey });
  
  return new DynamicStructuredTool({
    name: "parallelWebSearch",
    description: "Search the web for documentation, best practices, or external context related to React/Next.js development. Useful for finding latest information, framework documentation, or solutions to common problems.",
    schema: z.object({
      objective: z.string().describe("Clear objective describing what information you're looking for"),
      searchQueries: z.array(z.string()).describe("Array of specific search queries to execute"),
      maxResults: z.number().optional().default(10).describe("Maximum number of results to return per query (default: 10)")
    }),
    
    func: async (input): Promise<string> => {
      const { objective, searchQueries, maxResults } = input as { 
        objective: string, 
        searchQueries: string[], 
        maxResults?: number 
      };
      
      try {
        const searchResult = await parallelClient.beta.search({
          objective,
          search_queries: searchQueries,
          max_results: maxResults || 10,
          max_chars_per_result: 5000
        });
        
        if (!searchResult.results || searchResult.results.length === 0) {
          return `No web search results found for objective: "${objective}"`;
        }
        
        // Format results for better readability
        const formattedResults = searchResult.results.map((result, idx) => {
          const resultAny = result as any;
          return `Result ${idx + 1}:
Title: ${result.title || 'N/A'}
URL: ${result.url || 'N/A'}
Content: ${resultAny.content ? resultAny.content.substring(0, 1000) : resultAny.text ? resultAny.text.substring(0, 1000) : 'No content'}
---`;
        }).join('\n\n');
        
        return `Web Search Results for "${objective}":
        
Total results: ${searchResult.results.length}

${formattedResults}`;
        
      } catch (error) {
        return `Error performing web search: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
      }
    }
  });
};

export interface ProjectMessage {
    id: string;
    type: 'user' | 'assistant';
    prompt?: string;
    content: string;
    timestamp: string;
}


export const getProjects = cache(async () => {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
    const projects = await db.project.findMany({
        where: { userId: userId },
        select: {
            id: true,
            name: true,
            framework: true,
            createdAt: true,
            repoFullName: true,
            defaultBranch: true,
        }
    });
    return projects;
})


export async function getProject(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const project = await db.project.findUnique({
        where: { id: projectId, userId: userId },
        select: {
            name: true,
            userId: true,
            framework: true,
            createdAt: true,
            updatedAt: true,
            ProjectArchitecture: {
                orderBy: {
                    createdAt: 'desc', // Latest first
                },
                take: 5, // Only fetch latest 5
            },
            detailedAnalysis: true,
            ProjectChat: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });
    
    return project;
}

export async function saveProjectArchitecture(
    projectId: string,
    architectureRationale: string,
    components: any,
    connectionLabels: any,
    componentPositions?: any,
    projectStructure?: any,
    initialMessage?: string,
    commitInfo?: {
        commitHash?: string;
        branchName?: string;
        commitMessage?: string;
        beforeCommitHash?: string;
    }
) {
    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        });
        ;
        if (!project) {
            return { error: 'Project not found' };
        }

        // Always create a new architecture version (history)
        const savedArchitecture = await db.projectArchitecture.create({
            data: {
                projectId,
                architectureRationale,
                components,
                connectionLabels,
                componentPositions: componentPositions || {},
                projectStructure: projectStructure || null,
                ...(commitInfo?.commitHash && { commitHash: commitInfo.commitHash }),
                ...(commitInfo?.branchName && { branchName: commitInfo.branchName }),
                ...(commitInfo?.commitMessage && { commitMessage: commitInfo.commitMessage }),
                ...(commitInfo?.beforeCommitHash && { beforeCommitHash: commitInfo.beforeCommitHash }),
            }
        });

        // If we have an initial message, save it as the first assistant message
        if (initialMessage) {
            const assistantMessage: ProjectMessage = {
                id: `${Date.now()}-init`,
                type: 'assistant',
                content: initialMessage,
                timestamp: new Date().toISOString()
            };

            // Add the initial message to the project (will create/use first chat)
            await addMessageToProject(projectId, assistantMessage);
        }
        ;
        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error saving project architecture:", error);
        return { error: 'Failed to save project architecture' };
    }
}

// Update only component positions for a project (for performance during dragging)
export async function updateProjectComponentPositions(
    projectId: string, 
    positions: Record<string, { x: number; y: number }>
) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Fetch the latest architecture for this project
        const latestArchitectures = await db.projectArchitecture.findMany({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        
        if (!latestArchitectures || latestArchitectures.length === 0) {
            return { error: 'Architecture not found' };
        }

        const latestArchitecture = latestArchitectures[0];

        // Update only positions on the latest architecture
        const savedArchitecture = await db.projectArchitecture.update({
            where: { id: latestArchitecture.id },
            data: {
                componentPositions: positions,
                updatedAt: new Date()
            }
        });

        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error updating component positions:", error);
        return { error: 'Failed to update positions' };
    }
}

// Create a new project chat
export async function createProjectChat(projectId: string, title?: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Create new project chat
        const projectChat = await db.projectChat.create({
            data: {
                projectId,
                title: title || "New Chat",
                messages: []
            }
        });

        return { success: true, projectChat };
    } catch (error) {
        console.error("Error creating project chat:", error);
        return { error: 'Failed to create project chat' };
    }
}

// Get all project chats for a project
export async function getProjectChats(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Get all project chats
        const projectChats = await db.projectChat.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' }
        });

        return { success: true, projectChats };
    } catch (error) {
        console.error("Error getting project chats:", error);
        return { error: 'Failed to get project chats' };
    }
}

// Get a specific project chat
export async function getProjectChat(projectId: string, chatId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Get specific project chat
        const projectChat = await db.projectChat.findUnique({
            where: { 
                id: BigInt(chatId),
                projectId: projectId 
            }
        });

        if (!projectChat) {
            return { error: 'Project chat not found' };
        }

        return { success: true, projectChat };
    } catch (error) {
        console.error("Error getting project chat:", error);
        return { error: 'Failed to get project chat' };
    }
}

// Add message to project chat
export async function addMessageToProjectChat(projectId: string, chatId: string, message: ProjectMessage) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // Get current project chat
        const projectChat = await db.projectChat.findUnique({
            where: { 
                id: BigInt(chatId),
                projectId: projectId 
            }
        });

        if (!projectChat) {
            return { error: 'Project chat not found' };
        }

        // Add new message to existing messages
        const currentMessages = projectChat.messages as unknown as ProjectMessage[];
        const updatedMessages = [...currentMessages, message];

        // Prepare update data
        const updateData: any = {
            messages: updatedMessages as any,
            updatedAt: new Date()
        };

        // If this is a user message and it's the first message in the chat, update the title
        if (message.type === 'user' && currentMessages.length === 0) {
            const title = message.content.length > 20 
                ? message.content.substring(0, 20) + '...' 
                : message.content;
            updateData.title = title;
        }

        // Update project chat with new message and potentially new title
        const updatedProjectChat = await db.projectChat.update({
            where: { id: BigInt(chatId) },
            data: updateData
        });

        return { success: true, projectChat: updatedProjectChat };
    } catch (error) {
        console.error("Error adding message to project chat:", error);
        return { error: 'Failed to add message' };
    }
}

// Legacy function - redirects to chat-based function
export async function addMessageToProject(projectId: string, message: ProjectMessage, chatId?: string) {
    if (chatId) {
        return addMessageToProjectChat(projectId, chatId, message);
    }
    
    // If no chatId provided, create or get the first chat
    const chatsResult = await getProjectChats(projectId);
    if (!chatsResult.success) {
        return chatsResult;
    }

    let targetChatId: string;
    if (chatsResult.projectChats!.length === 0) {
        // Create first chat
        const createResult = await createProjectChat(projectId);
        if (!createResult.success) {
            return createResult;
        }
        targetChatId = createResult.projectChat!.id.toString();
    } else {
        targetChatId = chatsResult.projectChats![0].id.toString();
    }

    return addMessageToProjectChat(projectId, targetChatId, message);
}

// Update all messages in project chat
export async function updateProjectChatMessages(projectId: string, chatId: string, messages: ProjectMessage[]) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Update project chat with all messages
        const updatedProjectChat = await db.projectChat.update({
            where: { id: BigInt(chatId) },
            data: {
                messages: messages as any,
                updatedAt: new Date()
            }
        });

        return { success: true, projectChat: updatedProjectChat };
    } catch (error) {
        console.error("Error updating project chat messages:", error);
        return { error: 'Failed to update messages' };
    }
}

// Legacy function - redirects to chat-based function
export async function updateProjectMessages(projectId: string, messages: ProjectMessage[], chatId?: string) {
    if (chatId) {
        return updateProjectChatMessages(projectId, chatId, messages);
    }
    
    // If no chatId provided, update the first chat
    const chatsResult = await getProjectChats(projectId);
    if (!chatsResult.success) {
        return chatsResult;
    }

    if (chatsResult.projectChats!.length === 0) {
        return { error: 'No project chats found' };
    }

    const targetChatId = chatsResult.projectChats![0].id.toString();
    return updateProjectChatMessages(projectId, targetChatId, messages);
}


export async function projectChatBot( userId: string, userInput: string, projectFramework: string, conversationHistory: any[], projectArchitecture: any){
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');   
 
    const prompt = PromptTemplate.fromTemplate(ultraProjectChatBotPrompt);
    const chain = prompt.pipe(llm);
    const result = await chain.invoke({
        userQuery: userInput,
        framework: projectFramework,
        projectArchitecture: projectArchitecture,
        conversationHistory: formattedHistory
    });


    const textContent = extractTextContent(result.content);

    // Deduct credits
    if (userId) {
        const inputTokens = result.usage_metadata?.input_tokens ?? 0;
        const outputTokens = result.usage_metadata?.output_tokens ?? 0;
        
        const creditResult = await deductCredits(userId, inputTokens, outputTokens, true);
        if (!creditResult.success) {
            console.error("Failed to deduct credits:", creditResult.error);
            return textContent; 
        } else {
            console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
            return {
                textContent,
                remainingCredits: creditResult.remaining,
                deducted: creditResult.deducted
            };
        }
    }
}

export async function createPactProjectChatBot(
  userId: string,
  projectId: string,
  userInput: string,
  pactType: 'BUG' | 'TASK' | 'FEATURE',
  conversationHistory: any[]
) {
  try {

    // 2. Fetch Project Data
    const project = await db.project.findUnique({
      where: { id: projectId, userId: userId },
      select: {
        id: true,
        name: true,
        repoFullName: true,
        githubInstallationId: true,
        defaultBranch: true,
        framework: true,
        ProjectArchitecture: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    if (!project.repoFullName) {
      return { error: 'Project repository not configured' };
    }

    if (!project.githubInstallationId) {
      return { error: 'GitHub installation not configured for this project' };
    }

    // 3. Get GitHub Access Token
    const installationTokenResult = await getInstallationToken(project.githubInstallationId);
    const accessToken = installationTokenResult.token;

    // Extract owner and repo from repoFullName
    const [owner, repo] = project.repoFullName.split('/');
    if (!owner || !repo) {
      return { error: 'Invalid repository name format' };
    }

    // Get latest architecture
    const latestArchitecture = project.ProjectArchitecture && project.ProjectArchitecture.length > 0
      ? project.ProjectArchitecture[0]
      : null;

    const projectArchitecture = latestArchitecture 
      ? JSON.stringify({
          components: latestArchitecture.components,
          rationale: latestArchitecture.architectureRationale
        })
      : 'No architecture available';

    // 4. Initialize Tools
    const parallelWebSearchTool = createParallelWebSearchTool();
    
    // We need to bind the GitHub tools with the specific parameters
    // Create bound versions of the tools
    const boundSearchCodeTool = new DynamicStructuredTool({
      name: "searchCode",
      description: searchCodeTool.description,
      schema: z.object({
        query: z.string().describe("Search query (e.g., 'useEffect', '@nestjs/', 'function component')"),
        language: z.string().optional().describe("Filter by programming language (e.g., 'typescript', 'javascript')"),
        extension: z.string().optional().describe("Filter by file extension (e.g., 'ts', 'tsx', 'js')"),
        path: z.string().optional().describe("Filter by file path pattern (e.g., 'src/', 'components/')"),
      }),
      func: async (input: any) => {
        return await searchCodeTool.func({
          ...input,
          owner,
          repo,
          accessToken
        });
      }
    });

    const boundGetFileContentTool = new DynamicStructuredTool({
      name: "getFileContent",
      description: getFileContentTool.description,
      schema: z.object({
        path: z.string().describe("File path within the repository (e.g., 'src/app/page.tsx')"),
        branch: z.string().optional().describe("Branch name (optional, uses default branch if not specified)"),
      }),
      func: async (input: any) => {
        return await getFileContentTool.func({
          ...input,
          owner,
          repo,
          accessToken,
          branch: input.branch || project.defaultBranch || 'main'
        });
      }
    });

    const tools = [boundSearchCodeTool, boundGetFileContentTool, parallelWebSearchTool];

    // 5. Format Conversation History
    const formattedHistory = conversationHistory.map(msg =>
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const pactPrompt = pactType === 'BUG' ? projectChatBotBugPrompt : pactType === 'TASK' ? projectChatBotTaskPrompt : projectChatBotFeaturePrompt;

    // 6. Create Agent
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", pactPrompt],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    let tokenUsage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

    const trackedLlm = llm.withConfig({
        callbacks: [
          {
            handleLLMEnd(output: any) {
              const usage =
                output?.generations?.[0]?.[0]?.generationInfo?.usage ||
                output?.generations?.[0]?.[0]?.message?.response_metadata?.usage ||
                output?.llmOutput?.tokenUsage;
      
              if (!usage) return;
      
              tokenUsage.promptTokens +=
                usage.prompt_tokens ??
                usage.promptTokens ??
                usage.input_tokens ??
                0;
      
              tokenUsage.completionTokens +=
                usage.completion_tokens ??
                usage.completionTokens ??
                usage.output_tokens ??
                0;
      
              tokenUsage.totalTokens +=
                usage.total_tokens ??
                usage.totalTokens ??
                tokenUsage.promptTokens + tokenUsage.completionTokens;
            },
          },
        ],
      });
      

    const agent = await createToolCallingAgent({
      llm: trackedLlm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 15,
    });

    // 7. Execute Agent
    const agentResult = await agentExecutor.invoke({
      userInput,
      projectArchitecture,
      framework: project.framework || 'Unknown',
      conversationHistory: formattedHistory,
      repoFullName: project.repoFullName,
    });

    // Check if agent completed successfully
    if (!agentResult.output || typeof agentResult.output !== 'string') {
      return { error: 'Agent failed to generate a response. Please try again with a simpler request.' };
    }

    // Check for max iterations error
    if (agentResult.output.includes('Agent stopped due to max iterations') || 
        agentResult.output.includes('Agent stopped due to iteration limit')) {
      return { error: 'The request was too complex and exceeded the processing limit. Please try breaking it into smaller tasks.' };
    }

    // 8. Structure Output using LLM with structured output
    // const structuredLlm = llm.withStructuredOutput(pactOutputSchema);

    // Create a prompt to format the agent output into our schema
//     const formatterPrompt = PromptTemplate.fromTemplate(`
// You are formatting an agent's analysis into a structured pact format.

// The agent analyzed this request and provided the following output. Your job is to extract and format it properly.

// Agent's Analysis:
// {agentOutput}

// Pact Type: {pactType}

// Create a structured response with:
// 1. shortResponse: Extract or create a concise summary (under 200 words) of the key findings and recommendations
// 2. pact.title: Create a clear, actionable title for this {pactType}
// 3. pact.body: Format the detailed analysis as markdown following the {pactType} template

// IMPORTANT: The pact body should be well-formatted markdown with proper sections based on the pact type.
// `);

//     const formatterChain = formatterPrompt.pipe(structuredLlm);
    
//     const structuredOutput = await formatterChain.invoke({
//       agentOutput: agentCopyResult,
//       pactType
//     });

//     // Validate structured output
//     if (!structuredOutput || !structuredOutput.shortResponse || !structuredOutput.pact) {
//       return { error: 'Failed to generate properly formatted pact. Please try again.' };
//     }

//     if (!structuredOutput.pact.title || !structuredOutput.pact.body) {
//       return { error: 'Generated pact is missing required fields. Please try again.' };
//     }

    const structuredOutput = JSON.parse(agentResult.output);

    // Deduct credits
    if (userId) {
        const inputTokens = tokenUsage.promptTokens;
        const outputTokens = tokenUsage.completionTokens;
        
        const creditResult = await deductCredits(userId, inputTokens, outputTokens);
        return {
            content: {
                shortResponse: structuredOutput.shortResponse,
                pact: {
                  title: structuredOutput.pact.title,
                  body: structuredOutput.pact.body
                }
              },
            remainingCredits: creditResult.remaining,
            deducted: creditResult.deducted
        };
    }

  } catch (error) {
    console.error('Error in createPactProjectChatBot:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return { error: 'GitHub API rate limit exceeded. Please try again later.' };
      }
      if (error.message.includes('authentication')) {
        return { error: 'GitHub authentication failed. Please reconnect your repository.' };
      }
      if (error.message.includes('timeout')) {
        return { error: 'Request timeout. The operation took too long. Please try again.' };
      }
      
      return { error: `Failed to generate pact: ${error.message}` };
    }
    
    return { error: 'An unexpected error occurred while generating the pact' };
  }
}


// Get project context docs by ID
export async function getProjectContextDocs(projectChatId: any) {
    
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    ;

    try {
        
        const projectContextDocs = await db.projectContextDocs.findMany({
            where: {projectChatId: projectChatId}
        });
        
        if (!projectContextDocs) {
            return { error: 'Project context docs not found' };
        }
        
        return {success: true, projectContextDocs: projectContextDocs};
    } catch (error) {
        console.error("Error getting project context docs:", error);
        return { error: 'Failed to get project context docs' };
    }
} 


// System-level helper for Inngest to save the initial assistant message without requiring auth
export async function saveInitialMessageForInngestRevArchitecture(
    projectId: string,
    initialMessage: string,
    activeChatId?: string
) {
    try {
        // Ensure project exists
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        });
        if (!project) {
            return { error: 'Project not found' };
        }

        // Find target chat or create if missing
        let targetChat = activeChatId
            ? await db.projectChat.findUnique({
                where: { id: BigInt(activeChatId), projectId },
            })
            : await db.projectChat.findFirst({
                where: { projectId },
                orderBy: { createdAt: 'asc' }
            });

        if (!targetChat) {
            targetChat = await db.projectChat.create({
                data: {
                    projectId,
                    title: 'New Chat',
                    messages: [] as any
                }
            });
        }

        const currentMessages = (targetChat.messages as unknown as ProjectMessage[]) || [];

        // Idempotency: if any message exists, skip insertion
        if (currentMessages.length > 0) {
            return { success: true, skipped: true, reason: 'Chat already has messages' };
        }

        const assistantMessage: ProjectMessage = {
            id: `${Date.now()}-init`,
            type: 'assistant',
            content: initialMessage,
            timestamp: new Date().toISOString(),
        };

        // Title from initial message
        const title = initialMessage.length > 20
            ? initialMessage.substring(0, 20) + '...'
            : initialMessage;

        const updatedProjectChat = await db.projectChat.update({
            where: { id: targetChat.id },
            data: {
                title,
                messages: [assistantMessage] as any,
                updatedAt: new Date(),
            }
        });

        return { success: true, projectChat: updatedProjectChat };
    } catch (error) {
        console.error('Error saving initial message for Inngest:', error);
        return { error: 'Failed to save initial message' };
    }
}