import { BaseCallbackHandler } from "@langchain/core/callbacks/base";


export class TokenUsageCallbackHandler extends BaseCallbackHandler {
    name = "token_usage_handler";
    totalInputTokens = 0;
    totalOutputTokens = 0;
  
    async handleLLMEnd(output: any) {
      // Extract token usage from the LLM response
      if (output.llmOutput?.tokenUsage) {
        const usage = output.llmOutput.tokenUsage;
        this.totalInputTokens += usage.promptTokens || 0;
        this.totalOutputTokens += usage.completionTokens || 0;
      }else if (output.generations?.[0]?.[0]?.generationInfo?.usage) {
        const usage = output.generations[0][0].generationInfo.usage;
        this.totalInputTokens += usage.prompt_tokens || usage.input_tokens || 0;
        this.totalOutputTokens += usage.completion_tokens || usage.output_tokens || 0;
      }
    }
  
    getUsage() {
      return {
        inputTokens: this.totalInputTokens,
        outputTokens: this.totalOutputTokens
      };
    }
  }