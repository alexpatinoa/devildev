"use server";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { aimlComponentsTool } from "./architecture/aimlComponents"; 
import { analyticsComponentsTool } from "./architecture/analyticsComponents";
import { authComponentsTool } from "./architecture/authComponents";
import { blockchainComponentsTool } from "./architecture/blockchainComponents";
import { databaseComponentsTool } from "./architecture/databaseComponents";
import { mobileComponentsTool } from "./architecture/mobileComponents";
import { notificationComponentsTool } from "./architecture/notificationComponents";
import { paymentComponentsTool } from "./architecture/paymentComponents";
import { realtimeComponentsTool } from "./architecture/realtimeComponents";
import { basicWebComponentsTool } from "./architecture/webComponents";
import { deductCredits, getCredits } from "./credits";
import { minSoulsToGenArch } from "../Limits";
import { TokenUsageCallbackHandler } from "../common/TokenUsageHandler";
import { db } from "@/lib/db";
import { createParallelWebSearchTool } from "../tools/parallel";
import { ARCHITECTURE_GENERATION_PROMPT, ARCHITECTURE_UPDATE_PROMPT } from "../prompts/dev/architecture";
const { inngest } = await import('../src/inngest/client');



export async function triggerArchitectureGeneration(data: {
  generationId: string;
  requirement: string;
  conversationHistory: any[];
  architectureData: any;
  chatId: string;
  componentPositions: any;
  userId: string;
}) {
  // Check credits before triggering Inngest
  const creditsResult = await getCredits(data.userId);
  if (creditsResult.success && creditsResult.credits !== undefined && creditsResult.credits < minSoulsToGenArch) {
    return { success: false, error: 'INSUFFICIENT_CREDITS', remainingCredits: creditsResult.credits };
  }

  try {
    // Import inngest dynamically to avoid client-side bundling
    const response = await inngest.send({
      name: "architecture/generate",
      data: data
    });
    
    return { success: true, response };
  } catch (error) {
    console.error('Error triggering architecture generation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// JSON Schema for structured architecture output
const architectureJsonSchema = {
  type: "object",
  description: "Complete software architecture with components, connections, and rationale",
  properties: {
    components: {
      type: "array",
      description: "Array of architecture components",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Kebab-case unique identifier for the component" },
          title: { type: "string", description: "Exact component name" },
          icon: { type: "string", description: "Lucide icon name for the component" },
          color: { type: "string", description: "Color for the component (e.g., 'from-blue-500 to-blue-600')" },
          borderColor: { type: "string", description: "Border color for the component (e.g., 'border-blue-500/30')" },
          technologies: {
            type: "object",
            properties: {
              primary: { type: "string", description: "Primary technology from input" },
              framework: { type: "string", description: "Framework/library if applicable" },
              additional: { type: "string", description: "Supporting tools and libraries" }
            },
            required: ["primary", "framework", "additional"]
          },
          connections: {
            type: "array",
            items: { type: "string" },
            description: "Array of connected component IDs"
          },
          position: {
            type: "object",
            properties: {
              x: { type: "number", description: "X coordinate for component position" },
              y: { type: "number", description: "Y coordinate for component position" }
            },
            required: ["x", "y"]
          },
          dataFlow: {
            type: "object",
            properties: {
              sends: {
                type: "array",
                items: { type: "string" },
                description: "Specific data types this component sends"
              },
              receives: {
                type: "array",
                items: { type: "string" },
                description: "Specific data types this component receives"
              }
            },
            required: ["sends", "receives"]
          },
          purpose: { type: "string", description: "Clear, detailed explanation of component's role in the architecture" }
        },
        required: ["id", "title", "icon", "color", "borderColor", "technologies", "connections", "position", "dataFlow", "purpose"]
      }
    },
    connectionLabels: {
      type: "object",
      description: "Map of connection IDs (component1-id-component2-id) to their protocol/method labels",
      additionalProperties: { type: "string" }
    },
    architectureRationale: {
      type: "string",
      description: "2-3 sentence explanation of why this architecture is well-designed for the given requirements"
    }
  },
  required: ["components", "connectionLabels", "architectureRationale"]
};

// JSON Schema for main architecture output (includes PRD)
const architectureJsonSchemaWithPrd = {
  type: "object",
  description: "Complete software architecture with components, connections, rationale, and PRD",
  properties: {
    components: architectureJsonSchema.properties.components,
    connectionLabels: architectureJsonSchema.properties.connectionLabels,
    architectureRationale: architectureJsonSchema.properties.architectureRationale,
    prd: {
      type: "string",
      description: "Product requirements document in markdown format. Keep the tone technical but readable. Be specific to the actual project — no generic filler. Every section should feel like it was written for THIS project specifically."
    }
  },
  required: ["components", "connectionLabels", "architectureRationale", "prd"]
};

export async function generateArchitectureWithToolCalling(requirement: string, conversationHistory: any[] = [], architectureData: any, userId: string | null = null) {
  // Format conversation history for the prompt
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, model: "gpt-5-mini-2025-08-07" });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are DevilDev, an expert software architect specializing in modern, production-ready systems. Your primary task is to analyze software requirements and generate comprehensive architecture components using the appropriate tools, then return a structured JSON response.

MANDATORY TOOL SELECTION:
You MUST call exactly ONE of these platform tools based on the requirement:
- webComponents: For web-based applications (websites, web apps, SaaS platforms, admin dashboards, web portals, browser-based tools)
- mobileComponents: For mobile applications (iOS, Android, React Native, Flutter, cross-platform mobile apps)

PLATFORM DETECTION RULES:
- If requirement mentions: "web", "website", "dashboard", "admin panel", "SaaS", "browser", "portal" → Use webComponents
- If requirement mentions: "mobile", "iOS", "Android", "app store", "mobile app", "React Native", "Flutter" → Use mobileComponents  
- If platform is ambiguous or unspecified → Default to webComponents and mention assumption in response
- If both platforms mentioned → Ask for clarification on primary platform

OPTIONAL TOOLS (Use only when explicitly needed):
- aiml_components: When requirement mentions AI, ML, chatbots, intelligent features, recommendations, NLP, computer vision
- blockchain_components: When requirement mentions Web3, blockchain, NFTs, tokens, smart contracts, DeFi, cryptocurrency, wallet integration
- auth_components: When requirement mentions user accounts, login, authentication, user management, role-based access
- payment_components: When requirement mentions payments, e-commerce, subscriptions, billing, checkout, transactions
- realtime_components: When requirement mentions real-time updates, live chat, notifications, collaboration, live data
- database_components: When requirement mentions complex data relationships, analytics, reporting, data warehousing
- analytics_components: When requirement mentions tracking, metrics, analytics, monitoring, performance insights
- notification_components: When requirement mentions email, SMS, push notifications, alerts, communication

ANALYSIS PROCESS:
1. First, identify the target platform (web vs mobile) - this determines your mandatory tool
2. Then, scan for specific features that require additional tools
3. Only call tools for features mentioned or strongly implied
4. Avoid calling tools for basic/standard features already covered by platform tools
5. If the application includes CRUD operations, then call the database_components and auth_components no matter what

RESPONSE REQUIREMENTS:
After using the necessary tools, return your response in this EXACT JSON format:
{{
  "platform_assumption": "If platform wasn't explicitly stated, mention your assumption here, otherwise null",
  "components": [
    {{
      "name": "Exact Component Name From Tool Response",
      "technologies": ["Technology1", "Technology2"],
      "description": "Brief description of component's role in the architecture",
      "category": "platform|auth|payment|realtime|aiml|blockchain|database|analytics|notification"
  }}
  ],
  "architecture_summary": "2-3 sentence overview of the complete system architecture and how components work together",
  "tools_used": ["list", "of", "tools", "called"],
  "estimated_complexity": "low|medium|high"
  }}

QUALITY GUIDELINES:
- Be decisive about platform selection - don't hedge
- Only include components that are actually needed for the specific requirement
- Ensure all component names and technologies come directly from tool responses
- Provide clear reasoning for tool selection in your analysis
- If a requirement seems to need conflicting platforms, ask for clarification

CRITICAL SUCCESS FACTORS:
1. ALWAYS call exactly one platform tool (webComponents OR mobileComponents)
2. ONLY call additional tools when the requirement explicitly needs those features
3. Component data must match tool outputs exactly
4. Provide clear, actionable architecture guidance`],

    ["human", `Software Requirement: {requirement}

Conversation History:
{conversation_history}

Previous Architecture (if any):
{architecture_data}

Please analyze this requirement step by step:
1. Determine the target platform (web vs mobile)
2. Identify additional features that require specialized tools
3. Call the appropriate tools (mandatory platform tool + optional feature tools)
4. Return the structured JSON response with all required components

Focus on creating a practical, production-ready architecture that directly addresses the stated requirements.`],

    new MessagesPlaceholder("agent_scratchpad")
  ]);

  const finalPrompt = PromptTemplate.fromTemplate(`
  You are an expert Software Architecture Synthesizer. Your job is to take individual technology components and create a cohesive, well-structured architecture diagram with proper connections, positioning, and data flow.
  
  INPUT ANALYSIS:
  - 📝 Requirement: {requirement}
  - 🧠 Conversation History: {conversation_history}
  - 📦 Previous Architecture: {architectureData}
  - 🔧 Required Technology Stacks: {list_of_required_stacks}
  
  **ARCHITECTURE SYNTHESIS RULES:**
  
  **1. COMPONENT PROCESSING:**
  - Transform each component from the required stacks into a visual architecture element
  - Assign appropriate icons, colors, and positions based on component type
  - Create logical connections between related components
  - Define clear data flow patterns
  
  **2. COMPONENT CATEGORIZATION & STYLING:**
  
  **Frontend Components:**
  - Icons: "monitor" (web), "smartphone" (mobile), "globe" (public web)
  
  **Backend Components:**
  - Icons: "server" (API), "cpu" (processing), "database" (data layer)
  
  **Database Components:**
  - Icons: "database" (primary DB), "hard-drive" (storage)
  
  **AI/ML Components:**
  - Icons: "brain" (LLM), "zap" (processing), "eye" (vision)
  
  **Authentication Components:**
  - Icons: "shield" (auth service), "key" (tokens), "lock" (security)
  
  **Blockchain Components:**
  - Icons: "link" (contracts), "coins" (tokens), "wallet" (wallets)
  
  **Realtime Components:**
  - Icons: "radio" (websockets), "satellite" (broadcasting), "message-circle" (chat)
  
  **Payment Components:**
  - Icons: "credit-card" (payments), "banknote" (billing), "shopping-cart" (ecommerce)
  
  **4. CONNECTION PROTOCOLS:**
  - Frontend ↔ Backend: "REST API", "GraphQL", "tRPC"
  - Backend ↔ Database: "Database queries", "ORM"
  - Real-time: "WebSocket", "Server-Sent Events"
  - External APIs: "HTTP requests", "API calls"
  - Auth Flow: "OAuth flow", "JWT tokens"
  - Payment Flow: "Payment API", "Webhook"
  - AI Services: "API calls", "Streaming"
  
  **5. DATA FLOW PATTERNS:**
  - **Frontend** sends: ["user input", "form data", "API requests"]
  - **Frontend** receives: ["UI data", "API responses", "real-time updates"]
  - **Backend** sends: ["API responses", "database queries", "external requests"]
  - **Backend** receives: ["API requests", "database results", "webhook data"]
  - **Database** sends: ["query results", "real-time updates"]
  - **Database** receives: ["data writes", "queries"]
  
  **6. ID GENERATION:**
  Convert component names to kebab-case:
  - "Frontend" → "frontend"
  - "Backend API" → "backend-api"
  - "User Authentication" → "user-authentication"
  - "Payment Gateway" → "payment-gateway"
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "id": "kebab-case-id",
        "title": "Exact Component Name",
        "icon": "lucide-icon-name",
        "color": "any random color",
        "borderColor": "any random color",
        "technologies": {{
          "primary": "Primary technology from input",
          "framework": "Framework/library if applicable",
          "additional": "Supporting tools and libraries"
        }},
        "connections": ["array-of-connected-component-ids"],
        "position": {{ "x": random number, "y": random number }},
        "dataFlow": {{
          "sends": ["specific data types this component sends"],
          "receives": ["specific data types this component receives"]
        }},
        "purpose": "Clear, detailed explanation of component's role in the architecture"
      }}
    ],
      "connectionLabels": {{
      "component1-id-component2-id": "Connection protocol/method"
    }},
    "architectureRationale": "2-3 sentence explanation of why this architecture is well-designed for the given requirements, highlighting key benefits and design decisions"
  }}
  
  **SYNTHESIS INSTRUCTIONS:**
  1. **Parse the required stacks JSON** to identify all components and their technologies
  2. **Assign visual properties** (icon) based on component type
  3. **Create logical connections** between components that interact with each other
  4. **Define data flow** based on typical architecture patterns
  5. **Generate connection labels** describing how components communicate
  6. **Position components** in a logical flow from user-facing to data storage
  7. **Write architecture rationale** explaining the overall design benefits
  
  **QUALITY CHECKLIST:**
  - All components from input are included in output
  - Each component has appropriate icon and color for its type
  - Connections form a logical architecture flow
  - Data flow makes sense for each component type
  - Positions create a clean, readable diagram layout
  - Technologies match exactly with input data
  - Architecture rationale explains the design benefits
  
  Return only the JSON architecture structure.
  `);
  // Use structured output with JSON schema for guaranteed format
  const structuredLlm = llm.withStructuredOutput(architectureJsonSchema);
  const finalChain = finalPrompt.pipe(structuredLlm);

  const tools = [basicWebComponentsTool, aimlComponentsTool, analyticsComponentsTool, authComponentsTool, blockchainComponentsTool, databaseComponentsTool, mobileComponentsTool, notificationComponentsTool, paymentComponentsTool, realtimeComponentsTool];

  // Create token usage callback handler to track usage across all LLM calls
  const tokenUsageHandler = new TokenUsageCallbackHandler();

  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 10, // Allow multiple tool calls
  });

  try {
    const result = await agentExecutor.invoke(
      {
        requirement: requirement,
        conversation_history: formattedHistory,
        architecture_data: JSON.stringify(architectureData)
      },
      { callbacks: [tokenUsageHandler] }
    );

    const finalResult = await finalChain.invoke(
      {
        requirement: requirement,
        conversation_history: formattedHistory,
        architectureData: JSON.stringify(architectureData),
        list_of_required_stacks: JSON.stringify(result.output)
      },
      { callbacks: [tokenUsageHandler] }
    );

    // Deduct credits if userId is provided
    if (userId) {
      const usage = tokenUsageHandler.getUsage();
      const creditResult = await deductCredits(userId, usage.inputTokens, usage.outputTokens);
      if (!creditResult.success) {
        console.error("Failed to deduct credits:", creditResult.error);
      } else {
        console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
        console.log(`Total tokens used - Input: ${usage.inputTokens}, Output: ${usage.outputTokens}`);
      }
    }

    return finalResult;

  } catch (error) {
    console.error("Error in generateArchitectureWithToolCalling:", error);
    throw error;
  }
}


export async function generateMainArchitecture({
  requirement,
  title,
  technology,
  description,
  chatId,
  stackId,
  userId
}: {
  requirement: string;
  title: string;
  technology: string;
  description: string;
  chatId: string;
  stackId: string;
  userId: string;
}) {
  // Check credits before executing
  const creditsResult = await getCredits(userId);
  if (creditsResult.success && creditsResult.credits !== undefined && creditsResult.credits < minSoulsToGenArch) {
    return { success: false, error: 'INSUFFICIENT_CREDITS', remainingCredits: creditsResult.credits };
  }

  const tokenUsageHandler = new TokenUsageCallbackHandler();

  try {
    const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, model: "gpt-5-mini-2025-08-07" });

    const prompt = PromptTemplate.fromTemplate(ARCHITECTURE_GENERATION_PROMPT);

    const structuredLlm = llm.withStructuredOutput(architectureJsonSchemaWithPrd);
    const chain = prompt.pipe(structuredLlm);

    const generatedArchitecture = await chain.invoke(
      {
        requirement,
        title,
        technology,
        description,
      },
      { callbacks: [tokenUsageHandler] }
    );

    // Store in DB + persist PRD to Stack
    const [newArchitecture] = await db.$transaction([
      db.architecture.create({
        data: {
          chatId,
          stackId,
          requirement,
          architectureRationale: generatedArchitecture.architectureRationale,
          components: generatedArchitecture.components,
          connectionLabels: generatedArchitecture.connectionLabels || {},
          componentPositions: {},
        }
      }),
      db.stack.update({
        where: { id: stackId },
        data: { prd: generatedArchitecture.prd }
      })
    ]);

    // Deduct credits
    const usage = tokenUsageHandler.getUsage();
    const creditResult = await deductCredits(userId, usage.inputTokens, usage.outputTokens);
    if (!creditResult.success) {
      console.error("Failed to deduct credits:", creditResult.error);
    } else {
      console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
    }

    return {
      success: true,
      architecture: newArchitecture,
      prd: generatedArchitecture.prd,
      creditsRemaining: creditResult.remaining
    };

  } catch (error) {
    console.error("Error in generateMainArchitecture:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateArchitecture({
  changeRequirement,
  chatId,
  stackId,
  architecture_data,
  userId,
}: {
  changeRequirement: string;
  chatId: string;
  stackId?: string;
  architecture_data: any;
  userId: string;
}) {
  const creditsResult = await getCredits(userId);
  if (creditsResult.success && creditsResult.credits !== undefined && creditsResult.credits < minSoulsToGenArch) {
    return { success: false, error: 'INSUFFICIENT_CREDITS', remainingCredits: creditsResult.credits };
  }

  const tokenUsageHandler = new TokenUsageCallbackHandler();

  try {
    const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, model: "gpt-5-mini-2025-08-07" });

    const prompt = PromptTemplate.fromTemplate(ARCHITECTURE_UPDATE_PROMPT);

    const structuredLlm = llm.withStructuredOutput(architectureJsonSchemaWithPrd);
    const chain = prompt.pipe(structuredLlm);

    const updatedArchitecture = await chain.invoke(
      {
        changeRequirement,
        currentArchitecture: JSON.stringify(architecture_data),
      },
      { callbacks: [tokenUsageHandler] }
    );

    const dbOps: any[] = [
      db.architecture.create({
        data: {
          chatId,
          stackId,
          requirement: changeRequirement,
          architectureRationale: updatedArchitecture.architectureRationale,
          components: updatedArchitecture.components,
          connectionLabels: updatedArchitecture.connectionLabels || {},
          componentPositions: {},
        },
      }),
    ];

    if (stackId) {
      dbOps.push(
        db.stack.update({
          where: { id: stackId },
          data: { prd: updatedArchitecture.prd },
        })
      );
    }

    const [newArchitecture] = await db.$transaction(dbOps);

    const usage = tokenUsageHandler.getUsage();
    const creditResult = await deductCredits(userId, usage.inputTokens, usage.outputTokens);
    if (!creditResult.success) {
      console.error("Failed to deduct credits:", creditResult.error);
    } else {
      console.log(`Credits deducted: ${creditResult.deducted}, remaining: ${creditResult.remaining}`);
    }

    return {
      success: true,
      architecture: newArchitecture,
      prd: updatedArchitecture.prd,
      creditsRemaining: creditResult.remaining,
    };

  } catch (error) {
    console.error("Error in updateArchitecture:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
