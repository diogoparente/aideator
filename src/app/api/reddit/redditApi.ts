// Define the structure of a Reddit post
export interface RedditPost {
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

// Keywords to filter posts by - focused on identifying potential SaaS ideas
export const IDEA_KEYWORDS = [
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
export const NEGATIVE_KEYWORDS = [
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

// SaaS-related subreddits for better results
export const SAAS_SUBREDDITS = [
  "startups",
  "entrepreneur",
  "SaaS",
  "smallbusiness",
  "business",
  "productivity",
  "software",
  "webdev",
  "programming",
  "technology",
  "techsupport",
  "sideproject",
  "indiehackers",
];

/**
 * Integrated function to search Reddit for posts based on query and categories
 */
export async function searchRedditPosts(
  query: string,
  categories: string[] = [],
  customSubreddits: string[] = [],
  limit: number = 100,
): Promise<RedditPost[]> {
  console.log("🔄 [Reddit API] Searching Reddit with:", {
    query,
    categories,
    customSubreddits,
    limit,
  });

  let allPosts: RedditPost[] = [];

  try {
    // If categories or custom subreddits are specified, search within those subreddits
    if (categories.length > 0 || customSubreddits.length > 0) {
      console.log("🔍 [Reddit API] Searching in specific subreddits");

      // Combine selected categories and custom subreddits
      const subredditsToSearch = [...categories, ...customSubreddits];

      // Search in each subreddit
      const subredditSearchPromises = subredditsToSearch.map((subreddit) =>
        fetchSubredditPosts(
          subreddit,
          query,
          Math.floor(limit / subredditsToSearch.length),
        ),
      );

      const subredditResults = await Promise.all(subredditSearchPromises);
      allPosts = subredditResults.flat();

      console.log(
        `✅ [Reddit API] Found ${allPosts.length} posts in specified subreddits`,
      );
    }

    // If no posts found in specified subreddits or no subreddits specified, search across all of Reddit
    if (allPosts.length === 0) {
      console.log("🔍 [Reddit API] Searching across all of Reddit");
      allPosts = await searchRedditGlobal(query, limit);
      console.log(
        `✅ [Reddit API] Found ${allPosts.length} posts across Reddit`,
      );
    }

    // If still no posts found and we have a query, try searching in SaaS-related subreddits as a fallback
    if (allPosts.length === 0 && query) {
      console.log(
        "🔍 [Reddit API] Fallback: Searching in SaaS-related subreddits",
      );

      const subredditSearchPromises = SAAS_SUBREDDITS.map((subreddit) =>
        fetchSubredditPosts(
          subreddit,
          query,
          Math.floor(limit / SAAS_SUBREDDITS.length),
        ),
      );

      const subredditResults = await Promise.all(subredditSearchPromises);
      allPosts = subredditResults.flat();

      console.log(
        `✅ [Reddit API] Found ${allPosts.length} posts in SaaS subreddits`,
      );
    }

    // Filter posts by keywords
    console.log("🔄 [Reddit API] Filtering posts by keywords");
    let filteredPosts = allPosts.filter(
      (post) =>
        hasIdeaKeywords(post, IDEA_KEYWORDS) &&
        !hasNegativeKeywords(post, NEGATIVE_KEYWORDS),
    );

    // If filtering removed too many posts, use the original set but still remove negative keywords
    if (filteredPosts.length < 5 && allPosts.length > 10) {
      console.log(
        "⚠️ [Reddit API] Keyword filtering too restrictive, using less strict filtering",
      );
      filteredPosts = allPosts.filter(
        (post) => !hasNegativeKeywords(post, NEGATIVE_KEYWORDS),
      );
    }

    // Sort posts by relevance
    console.log("🔄 [Reddit API] Sorting posts by relevance");
    const sortedPosts = sortPostsByRelevance(filteredPosts, IDEA_KEYWORDS);

    // Limit the number of posts returned
    const limitedPosts = sortedPosts.slice(0, limit);
    console.log(`✅ [Reddit API] Returning ${limitedPosts.length} posts`);

    return limitedPosts;
  } catch (error) {
    console.error("❌ [Reddit API] Error searching Reddit:", error);
    throw error;
  }
}

/**
 * Searches Reddit globally for posts matching a query
 */
async function searchRedditGlobal(
  query: string,
  limit: number,
): Promise<RedditPost[]> {
  // Enhance the query with SaaS-related terms if not already present
  let enhancedQuery = query;

  // If the query is short or generic, enhance it with SaaS-related terms
  if (
    query.length < 20 &&
    !query.toLowerCase().includes("saas") &&
    !query.toLowerCase().includes("software")
  ) {
    enhancedQuery = `${query} (app OR software OR tool OR solution OR platform OR service)`;
  }

  // Add filtering for self posts which tend to have more detailed problems/requests
  enhancedQuery = `${enhancedQuery} self:yes`;

  console.log("🔍 [Reddit API] Enhanced query:", enhancedQuery);

  // Use Reddit's search endpoint to search across all subreddits
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(enhancedQuery)}&sort=relevance&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "web:reddit-insights:v1.0.0 (by /u/redditinsights)",
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error(`Failed to search Reddit: ${response.status}`);
  }

  const data = await response.json();

  return data.data.children.map((child: any) => {
    const post = child.data;
    return {
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      url: `https://www.reddit.com${post.permalink}`,
      score: post.score,
      created_utc: post.created_utc,
      num_comments: post.num_comments,
      selftext: post.selftext || "",
      author: post.author,
    };
  });
}

/**
 * Fetches posts from a specific subreddit with an optional query
 */
async function fetchSubredditPosts(
  subreddit: string,
  query: string = "",
  limit: number = 25,
): Promise<RedditPost[]> {
  try {
    // Build the URL based on whether we have a query or not
    let url;
    if (query) {
      // Search within the subreddit
      url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}`;
    } else {
      // Just get the top posts from the subreddit
      url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "web:reddit-insights:v1.0.0 (by /u/redditinsights)",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(
        `❌ [Reddit API] Failed to fetch from r/${subreddit}: ${response.status}`,
      );
      return [];
    }

    const data = await response.json();

    return data.data.children.map((child: any) => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score,
        created_utc: post.created_utc,
        num_comments: post.num_comments,
        selftext: post.selftext || "",
        author: post.author,
      };
    });
  } catch (error) {
    console.error(`❌ [Reddit API] Error fetching from r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Checks if a post contains any of the idea keywords in title or content
 */
function hasIdeaKeywords(post: RedditPost, keywords: string[]): boolean {
  const content = `${post.title.toLowerCase()} ${post.selftext.toLowerCase()}`;
  return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
}

/**
 * Checks if a post contains any negative keywords that would indicate it's not idea-related
 */
function hasNegativeKeywords(
  post: RedditPost,
  negativeKeywords: string[],
): boolean {
  const content = `${post.title.toLowerCase()} ${post.selftext.toLowerCase()}`;
  return negativeKeywords.some((keyword) =>
    content.includes(keyword.toLowerCase()),
  );
}

/**
 * Sorts posts by relevance to SaaS ideas using a weighted algorithm
 */
function sortPostsByRelevance(
  posts: RedditPost[],
  ideaKeywords: string[],
): RedditPost[] {
  // Calculate relevance score for each post
  const postsWithScores = posts.map((post) => {
    const relevanceScore = calculateRelevanceScore(post, ideaKeywords);
    return { ...post, relevanceScore };
  });

  // Sort by relevance score (highest first)
  return postsWithScores.sort(
    (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
  );
}

/**
 * Calculates a relevance score for a post based on multiple factors
 */
function calculateRelevanceScore(
  post: RedditPost,
  ideaKeywords: string[],
): number {
  let score = 0;
  const title = post.title.toLowerCase();
  const selftext = post.selftext.toLowerCase();
  const combinedContent = `${title} ${selftext}`;

  // Base score from Reddit (upvotes and comments)
  score += post.score * 0.1;
  score += post.num_comments * 0.5;

  // Keyword matches in title are more important
  ideaKeywords.forEach((keyword) => {
    if (title.includes(keyword.toLowerCase())) {
      score += 10; // Higher weight for title matches
    }
    if (selftext.includes(keyword.toLowerCase())) {
      score += 5; // Lower weight for body matches
    }
  });

  // Bonus for posts in SaaS-related subreddits
  if (SAAS_SUBREDDITS.includes(post.subreddit.toLowerCase())) {
    score += 15;
  }

  // Bonus for posts with question marks (likely asking for solutions)
  if (title.includes("?") || selftext.includes("?")) {
    score += 10;
  }

  // Bonus for longer, more detailed posts
  if (selftext.length > 500) {
    score += 15;
  }

  // Bonus for posts with multiple paragraphs (more detailed)
  const paragraphCount = (selftext.match(/\n\s*\n/g) || []).length + 1;
  if (paragraphCount > 3) {
    score += 10;
  }

  // Bonus for specific SaaS-related terms
  const saasTerms = [
    "saas",
    "software",
    "app",
    "platform",
    "tool",
    "solution",
    "service",
  ];
  saasTerms.forEach((term) => {
    if (combinedContent.includes(term)) {
      score += 5;
    }
  });

  return score;
}
