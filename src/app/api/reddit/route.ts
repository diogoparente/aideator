import { NextRequest, NextResponse } from "next/server";
import { searchRedditPosts, SAAS_SUBREDDITS } from "./redditApi";

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

// Keywords to filter posts by - focused on identifying potential SaaS ideas
const IDEA_KEYWORDS = [
  // Problem statements
  "looking for",
  "seeking",
  "need help",
  "need a solution",
  "pain point",
  "frustrated with",
  "annoyed by",
  "wish there was",
  "if only there was",
  "problem with",
  "challenge with",
  "hate when",
  "tired of",
  "can't stand",
  "struggle with",
  "difficult to",

  // Solution seeking
  "anyone know",
  "recommend",
  "suggestion",
  "alternative to",
  "better than",
  "instead of",
  "replacement for",
  "tool for",
  "app for",
  "software for",
  "platform for",

  // Opportunity indicators
  "gap in the market",
  "business opportunity",
  "startup idea",
  "saas idea",
  "potential product",
  "market need",
  "unmet need",
  "would pay for",
  "would subscribe to",
  "willing to pay",
  "shut up and take my money",
  "take my money",

  // Validation phrases
  "validate my idea",
  "feedback on my idea",
  "thoughts on this idea",
  "would you use",
  "would you pay for",
  "is there a market for",
  "is this a good idea",
];

// Negative keywords to filter out non-idea posts
const NEGATIVE_KEYWORDS = [
  "hiring",
  "job posting",
  "job offer",
  "for hire",
  "looking to hire",
  "seeking employment",
  "my portfolio",
  "check out my",
  "sale",
  "discount",
  "coupon",
  "promo",
  "affiliate",
  "referral",
  "advertisement",
  "sponsored",
  "self promotion",
  "my youtube",
  "my channel",
  "my blog",
];

// Minimum thresholds for post quality
const MIN_SCORE = 5;
const MIN_COMMENTS = 3;

/**
 * Fetches posts from Reddit based on search query and/or subreddit categories and filters them by keywords
 */
export async function GET(request: NextRequest) {
  console.log("🔄 [Reddit API Route] Processing request");

  try {
    // Get search parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const categoriesParam = searchParams.get("categories") || "";
    const customSubredditsParam = searchParams.get("customSubreddits") || "";
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    // Parse categories and custom subreddits
    const categories = categoriesParam ? categoriesParam.split(",") : [];
    const customSubreddits = customSubredditsParam
      ? customSubredditsParam.split(",")
      : [];

    console.log("📝 [Reddit API Route] Search parameters:", {
      query,
      categories,
      customSubreddits,
      limit,
    });

    // If no query and no categories/subreddits, return a helpful error
    if (!query && categories.length === 0 && customSubreddits.length === 0) {
      console.log("⚠️ [Reddit API Route] No search parameters provided");
      return NextResponse.json(
        {
          error:
            "Please provide a search query and/or select subreddit categories",
          availableCategories: SAAS_SUBREDDITS,
        },
        { status: 400 },
      );
    }

    // Search Reddit for posts
    console.log("🔍 [Reddit API Route] Searching Reddit");
    const posts = await searchRedditPosts(
      query,
      categories,
      customSubreddits,
      limit,
    );

    console.log(`✅ [Reddit API Route] Found ${posts.length} posts`);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("❌ [Reddit API Route] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit posts" },
      { status: 500 },
    );
  }
}
