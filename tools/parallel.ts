import { DynamicStructuredTool } from "langchain/tools";
import Parallel from "parallel-web";
import z from "zod";


const parallelApiKey = process.env.PARALLEL_API_KEY;
export const createParallelWebSearchTool = () => {
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