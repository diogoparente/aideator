import { NextRequest, NextResponse } from "next/server";
import { searchRedditPosts } from "../reddit/redditApi";
import { sendProgressUpdate } from "../progress/route";

// Define the structure of a Reddit post
interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
  num_comments: number;
  selftext: string;
  author: string;
  relevanceScore?: number;
}

// Define the structure for insights response
interface InsightsResponse {
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
 * Integrated search endpoint that:
 * 1. Enhances search query using Deepseek
 * 2. Searches Reddit for posts
 * 3. Generates insights using Deepseek
 */
export async function GET(request: NextRequest) {
  console.log("🔍 [Search API] Processing search request");

  try {
    // Get search parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const categories = searchParams.getAll("categories");
    const customSubreddits = searchParams.getAll("customSubreddits");
    const limit = parseInt(searchParams.get("limit") || "100");

    sendProgressUpdate(0, "Starting search");

    console.log("📝 [Search API] Search parameters:", {
      query,
      categories: categories.length,
      customSubreddits: customSubreddits.length,
      limit,
    });

    if (!query) {
      console.log("❌ [Search API] Missing query parameter");
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Step 1: Enhance the search query using Deepseek
    sendProgressUpdate(0.2, "Enhancing search query");

    console.log("🔄 [Search API] Enhancing search query with Deepseek");
    const enhancedQuery = await enhanceSearchQuery(query);
    console.log(`✅ [Search API] Enhanced query: "${enhancedQuery}"`);

    // Step 2: Search Reddit for posts with the enhanced query
    console.log(
      "🔄 [Search API] Searching Reddit for posts with enhanced query"
    );
    const posts = await searchRedditPosts(
      enhancedQuery,
      categories,
      customSubreddits,
      limit
    );
    sendProgressUpdate(0.5, `Found ${posts.length} Reddit posts`);

    console.log(`✅ [Search API] Found ${posts.length} Reddit posts`);

    if (posts.length === 0) {
      console.log("ℹ️ [Search API] No posts found, returning empty results");
      return NextResponse.json({ posts: [], insights: null });
    }

    // Step 3: Generate insights using Deepseek
    sendProgressUpdate(0.6, "Analyzing posts for insights");
    console.log("🔄 [Search API] Generating insights from posts");
    const insights = await generateInsights(posts);
    sendProgressUpdate(0.9, "Insights generated");
    console.log("✅ [Search API] Successfully generated insights");

    // Step 4: Return both posts and insights
    sendProgressUpdate(1, "Search complete");
    return NextResponse.json({ posts, insights });
  } catch (error) {
    console.error("❌ [Search API] Error processing search request:", error);
    sendProgressUpdate(1, "Search failed: An error occurred");
    return NextResponse.json(
      { error: "Failed to process search request" },
      { status: 500 }
    );
  }
}

/**
 * Enhances a search query using Deepseek to improve search results
 */
async function enhanceSearchQuery(originalQuery: string): Promise<string> {
  console.log("🔄 [Search API] Starting query enhancement");

  // Check if Deepseek API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log(
      "❌ [Search API] Missing Deepseek API key in environment variables"
    );
    throw new Error("Deepseek API key is not configured");
  }

  const prompt = `
    I need to search Reddit for information about potential SaaS business opportunities related to:
    "${originalQuery}"

    Please enhance and expand this search query to:
    1. Include relevant keywords and synonyms
    2. Capture various aspects or angles of this topic
    3. Use specific terminology that Reddit users might use
    4. Format it optimally for a Reddit search
    5. Make it more specific if too broad, or broaden it if too specific

    Return ONLY the enhanced search query as plain text with no additional commentary.
  `;

  try {
    console.log(
      "🌐 [Search API] Sending query enhancement request to Deepseek API"
    );

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
                "You are a search query optimization expert who can transform vague queries into specific, comprehensive search terms that will yield better results.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `❌ [Search API] Error enhancing query: ${response.status} ${response.statusText}`
      );
      // Fall back to original query if enhancement fails
      return originalQuery;
    }

    const data = await response.json();
    const enhancedQuery = data.choices[0].message.content.trim();

    // If the response is empty or too long, fall back to original query
    if (!enhancedQuery || enhancedQuery.length > 500) {
      console.log("⚠️ [Search API] Invalid enhanced query, using original");
      return originalQuery;
    }

    return enhancedQuery;
  } catch (error) {
    console.error("❌ [Search API] Error enhancing query:", error);
    // Fall back to original query if there's an error
    return originalQuery;
  }
}

/**
 * Generates insights from posts using Deepseek
 */
async function generateInsights(
  posts: RedditPost[]
): Promise<InsightsResponse> {
  console.log("🔄 [Search API] Starting insights generation");

  // Check if Deepseek API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log(
      "❌ [Search API] Missing Deepseek API key in environment variables"
    );
    throw new Error("Deepseek API key is not configured");
  }

  // Prepare the data for analysis
  const postsForAnalysis = posts.map((post: RedditPost) => ({
    id: post.id,
    title: post.title,
    subreddit: post.subreddit,
    score: post.score,
    num_comments: post.num_comments,
    url: post.url,
    text: post.selftext.substring(0, 2000), // Increased text length for better context
  }));

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
       - A list of post IDs that support this idea (reference the post IDs from the analyzed posts)
    
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
          "validationSteps": ["step1", "step2", ...],
          "supportingPostIds": ["postId1", "postId2", ...]
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

  console.log("📝 [Search API] Prompt prepared, length:", prompt.length);

  try {
    sendProgressUpdate(0.7, "Generating insights with AI");
    console.log("🌐 [Search API] Sending request to Deepseek API");
    console.log(
      `🔑 [Search API] Using API key: ${process.env.DEEPSEEK_API_KEY?.substring(
        0,
        5
      )}...`
    );

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
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ [Search API] Response received in ${responseTime}ms`);

    if (!response.ok) {
      console.error(
        `❌ [Search API] Error response: ${response.status} ${response.statusText}`
      );
      throw new Error(`Deepseek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [Search API] Successfully parsed response JSON");

    const content = data.choices[0].message.content;
    console.log("📄 [Search API] Content length:", content.length);

    try {
      sendProgressUpdate(0.8, "Processing AI insights");
      const parsedContent = JSON.parse(content) as InsightsResponse;
      console.log("✅ [Search API] Successfully parsed content as JSON");
      console.log("📊 [Search API] Insights summary:", {
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

      // Ensure supportingPostIds exists for all ideas
      parsedContent.potentialSaasIdeas.forEach((idea) => {
        if (!idea.supportingPostIds) {
          idea.supportingPostIds = [];
        }
      });

      return parsedContent;
    } catch (parseError) {
      console.error(
        "❌ [Search API] Failed to parse content as JSON:",
        parseError
      );
      console.log(
        "📄 [Search API] Content preview:",
        content.substring(0, 200) + "..."
      );
      throw new Error("Failed to parse Deepseek response as JSON");
    }
  } catch (error) {
    console.error("❌ [Search API] Error with Deepseek API:", error);
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

/**
 * API endpoint to get posts associated with a specific app idea
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supportingPostIds, allPosts } = body;

    if (!supportingPostIds || !allPosts) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Filter posts based on supportingPostIds
    const supportingPosts = allPosts.filter((post: any) =>
      supportingPostIds.includes(post.id)
    );

    return NextResponse.json({ posts: supportingPosts });
  } catch (error) {
    console.error("Error processing search request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
