import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "./deepseekApi";

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
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Generates insights from Reddit posts using Deepseek
 */
export async function POST(request: NextRequest) {
  console.log(" [Deepseek API] Processing request");
  try {
    const { posts } = await request.json();

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      console.log(
        " [Deepseek API] Invalid request: empty or invalid posts array",
      );
      return NextResponse.json(
        { error: "Posts array is required and must not be empty" },
        { status: 400 },
      );
    }

    console.log(` [Deepseek API] Received ${posts.length} posts for analysis`);

    // Add mapping function to transform posts into the RedditPost format
    const formattedPosts = posts.map((post) => ({
      ...post,
      id: post.url.split("/").pop() || `id-${Math.random()}`,
      created_utc: Date.now() / 1000,
      selftext: post.text,
      author: "unknown",
    }));

    console.log(
      " [Deepseek API] Prepared posts for analysis, sending to Deepseek",
    );

    // Generate insights using Deepseek
    const insights = await generateInsights(formattedPosts);

    console.log(" [Deepseek API] Successfully generated insights");
    console.log(
      ` [Deepseek API] Generated ${insights.potentialSaasIdeas.length} SaaS ideas`,
    );

    return NextResponse.json({
      insights,
      supportingPosts: formattedPosts,
    });
  } catch (error) {
    console.error(" [Deepseek API] Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
