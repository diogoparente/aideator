"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import SearchPanel from "./_components/SearchPanel";
import { InsightsResponse } from "../../api/deepseek/deepseekApi";
import SearchResults from "./_components/SearchResults";
import { Idea } from "@/db/schema";
import { useUser } from "@/hooks/useUser";
// import ParticlesAnimation from "@/components/ui/particles-animation";

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

// Define the structure for SaaS ideas
export interface SaasIdea {
  name: string;
  description: string;
  targetAudience: string;
  potentialFeatures: string[];
  validationSteps: string[];
}

// Define the structure for competitive landscape
export interface CompetitiveLandscape {
  existingSolutions: string[];
  gaps: string[];
}

// Define the structure for implementation complexity
export interface ImplementationComplexity {
  technical: string;
  market: string;
  timeToMvp: string;
}

// Define the structure for insights response
export interface InsightsData {
  commonProblems: string[];
  potentialSaasIdeas: Idea[];
  marketTrends: string[];
  userPainPoints: string[];
  recommendations: string[];
  competitiveLandscape: CompetitiveLandscape;
  monetizationStrategies: string[];
  implementationComplexity: ImplementationComplexity;
  actionPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export default function Dashboard() {
  const { user, loading } = useUser();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (posts.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [posts]);

  useEffect(() => {
    // Only scroll when search is complete AND we have results
    if (
      hasSearched &&
      !searching &&
      !isLoading &&
      insights?.potentialSaasIdeas &&
      insights.potentialSaasIdeas.length > 0
    ) {
      // Add a small delay to ensure the UI has updated before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
  }, [hasSearched, searching, isLoading, insights]);

  // Handle search function
  const handleSearch = async (query: string, categories: string[] = []) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setSelectedCategories(categories);
    setSearching(true);
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Build URL with query parameters
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.append("query", query.trim());

      // Add categories as subreddits to search
      if (categories.length > 0) {
        categories.forEach((category) => {
          url.searchParams.append("customSubreddits", category);
        });
      }

      // Make API request
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json();

      setPosts(data.posts || []);
      setInsights(data.insights);

      if (data.posts?.length === 0) {
        toast.info(
          "No results found. Try a different search query or subreddits."
        );
      } else {
        toast.success(`Found ${data.posts?.length} relevant discussions`);
      }

      // Keep searching state true for a moment to show the completed progress bar
      setTimeout(() => {
        setSearching(false);
      }, 1000);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred while searching. Please try again.");
      setPosts([]);
      setInsights(null);
      setSearching(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Particles Animation - only visible during searching */}
      {/* <ParticlesAnimation isActive={searching} /> */}

      <div className="container mx-auto py-4 px-4 relative z-10 flex-grow flex flex-col justify-center">
        <div
          ref={searchContainerRef}
          className={`w-full flex flex-col items-center transition-all duration-700 ease-in-out ${
            hasSearched &&
            !searching &&
            insights?.potentialSaasIdeas &&
            insights.potentialSaasIdeas.length > 0
              ? "mt-8"
              : ""
          }`}
        >
          <SearchPanel
            onSearch={handleSearch}
            searchQuery={searchQuery}
            searching={searching}
            isLoading={isLoading}
          />
          <div className="mt-2 w-full max-w-3xl mx-auto">
            <SearchResults
              isLoading={isLoading}
              posts={posts}
              insights={insights as InsightsResponse | null}
              searchInProgress={searching}
              showResults={hasSearched && !searching}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
