import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
}

/**
 * Generates insights from Reddit posts using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const { posts } = await request.json();

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "Posts array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
    }

    // Prepare the data for analysis
    const postsForAnalysis = posts.map((post: RedditPost) => ({
      title: post.title,
      subreddit: post.subreddit,
      score: post.score,
      num_comments: post.num_comments,
      url: post.url,
      text: post.selftext.substring(0, 1000), // Increased text length for better context
    }));

    // Generate insights using OpenAI
    const insights = await generateInsights(postsForAnalysis);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}

/**
 * Generates insights from posts using OpenAI
 */
async function generateInsights(posts: any[]): Promise<InsightsResponse> {
  const prompt = `
    Analyze the following Reddit posts to identify potential SaaS business opportunities:

    ${JSON.stringify(posts, null, 2)}

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
      }
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
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
    temperature: 0.7, // Slightly increased temperature for more creative ideas
  });

  const content = response.choices[0].message.content;

  try {
    return JSON.parse(content || "{}") as InsightsResponse;
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    return {
      commonProblems: ["Error parsing insights"],
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
    };
  }
}
