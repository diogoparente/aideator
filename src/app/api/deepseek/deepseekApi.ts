import { RedditPost } from "../reddit/redditApi";

// Define the structure for insights response
export interface InsightsResponse {
  commonProblems: string[];
  potentialSaasIdeas: {
    name: string;
    description: string;
    targetAudience: string;
    potentialFeatures: string[];
    validationSteps: string[];
    supportingPostIds: string[];
  }[];
  marketTrends: string[];
  userPainPoints: string[];
  recommendations: string[];
  competitiveLandscape: {
    existingSolutions: string[];
    gaps: string[];
  };
  monetizationStrategies: string[];
  implementationComplexity: {
    technical: string;
    market: string;
    timeToMvp: string;
  };
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Generates insights from posts using Deepseek
 */
export async function generateInsights(
  posts: RedditPost[],
): Promise<InsightsResponse> {
  console.log("🧠 [Deepseek API] Starting insights generation");

  // Check if Deepseek API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error(
      "❌ [Deepseek API] Missing Deepseek API key in environment variables",
    );
    throw new Error("Deepseek API key is not configured");
  }

  // Prepare the data for analysis
  const postsForAnalysis = posts.map((post: RedditPost) => ({
    title: post.title,
    subreddit: post.subreddit,
    score: post.score,
    num_comments: post.num_comments,
    url: post.url,
    text: post.selftext.substring(0, 2000), // Limit text length for API constraints
  }));

  console.log(
    `🔄 [Deepseek API] Prepared ${postsForAnalysis.length} posts for analysis`,
  );

  const prompt = `
    Analyze the following Reddit posts to identify potential SaaS business opportunities:

    ${JSON.stringify(postsForAnalysis, null, 2)}

    Your task is to thoroughly analyze these posts from the perspective of a SaaS entrepreneur looking for new business ideas. Focus on identifying:

    1. Common Problems: What are the most common problems or needs people are expressing? Prioritize problems that appear repeatedly or have strong emotional language.
    
    2. Potential SaaS Ideas: For each major problem area, develop a detailed SaaS product idea that could address it. Include:
       - A clear product name and concept
       - Brief description of how it would work
       - Target audience
       - Key features
       - Steps to validate the idea
    
    3. Market Trends: What broader trends in technology, business, or consumer behavior do these posts suggest? What's growing or declining?
    
    4. User Pain Points: What specific frustrations, inefficiencies, or gaps in existing solutions are users experiencing?
    
    5. Competitive Landscape: What existing solutions are mentioned? What gaps exist in those solutions?
    
    6. Monetization Strategies: What pricing models or monetization approaches would work best for the SaaS ideas you've identified?
    
    7. Implementation Complexity: For the top ideas, assess the technical complexity, market entry difficulty, and estimated time to MVP.
    
    8. Recommendations: What strategic recommendations would you give to someone looking to build a SaaS product in this space?
    
    9. Action Plan: Provide a concrete action plan with immediate steps (next 2 weeks), short-term goals (1-3 months), and long-term milestones (3-12 months) for implementing the most promising SaaS idea.

    Format your response as JSON with the following structure:
    {
      "commonProblems": ["problem1", "problem2", ...],
      "potentialSaasIdeas": [
        {
          "name": "Product Name",
          "description": "Brief description",
          "targetAudience": "Who would use this",
          "potentialFeatures": ["feature1", "feature2", ...],
          "validationSteps": ["step1", "step2", ...]
        },
        ...
      ],
      "marketTrends": ["trend1", "trend2", ...],
      "userPainPoints": ["painPoint1", "painPoint2", ...],
      "recommendations": ["recommendation1", "recommendation2", ...],
      "competitiveLandscape": {
        "existingSolutions": ["solution1", "solution2", ...],
        "gaps": ["gap1", "gap2", ...]
      },
      "monetizationStrategies": ["strategy1", "strategy2", ...],
      "implementationComplexity": {
        "technical": "assessment of technical difficulty",
        "market": "assessment of market entry difficulty",
        "timeToMvp": "estimated time to minimum viable product"
      },
      "actionPlan": {
        "immediate": ["step1", "step2", ...],
        "shortTerm": ["step1", "step2", ...],
        "longTerm": ["step1", "step2", ...]
      }
    }
  `;

  console.log("🔄 [Deepseek API] Prompt prepared, length:", prompt.length);

  try {
    console.log("🔄 [Deepseek API] Sending request to Deepseek API");

    const startTime = Date.now();
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are an expert SaaS product strategist and business analyst with deep experience in identifying market opportunities, validating business ideas, and building successful software products. Your analysis should be detailed, actionable, and focused on helping entrepreneurs identify viable SaaS opportunities.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      },
    );

    const responseTime = Date.now() - startTime;
    console.log(`✅ [Deepseek API] Response received in ${responseTime}ms`);

    if (!response.ok) {
      console.error(
        `❌ [Deepseek API] Error response: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Deepseek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [Deepseek API] Successfully parsed response JSON");

    const content = data.choices[0].message.content;
    console.log("🔄 [Deepseek API] Content length:", content.length);

    try {
      const parsedContent = JSON.parse(content) as InsightsResponse;
      console.log("✅ [Deepseek API] Successfully parsed content as JSON");
      console.log("📊 [Deepseek API] Insights summary:", {
        commonProblems: parsedContent.commonProblems.length,
        saasIdeas: parsedContent.potentialSaasIdeas.length,
        marketTrends: parsedContent.marketTrends.length,
        painPoints: parsedContent.userPainPoints.length,
        recommendations: parsedContent.recommendations.length,
        monetizationStrategies: parsedContent.monetizationStrategies.length,
        immediateActions: parsedContent.actionPlan.immediate.length,
        shortTermActions: parsedContent.actionPlan.shortTerm.length,
        longTermActions: parsedContent.actionPlan.longTerm.length,
      });

      return parsedContent;
    } catch (parseError) {
      console.error(
        "❌ [Deepseek API] Failed to parse content as JSON:",
        parseError,
      );
      console.log(
        "⚠️ [Deepseek API] Content preview:",
        content.substring(0, 200) + "...",
      );
      throw new Error("Failed to parse Deepseek response as JSON");
    }
  } catch (error) {
    console.error("❌ [Deepseek API] Error with Deepseek API:", error);
    return {
      commonProblems: ["Error generating insights"],
      potentialSaasIdeas: [],
      marketTrends: [],
      userPainPoints: [],
      recommendations: [],
      competitiveLandscape: {
        existingSolutions: [],
        gaps: [],
      },
      monetizationStrategies: [],
      implementationComplexity: {
        technical: "Unknown",
        market: "Unknown",
        timeToMvp: "Unknown",
      },
      actionPlan: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
      },
    };
  }
}
