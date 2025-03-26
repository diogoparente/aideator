import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { InsightsResponse } from "@/app/[locale]/api/deepseek/deepseekApi";
import { RedditPost } from "@/app/[locale]/app/dashboard/page";

// Add missing component imports
import SaasIdeaCard from "./SaasIdeaCard";
import RedditDiscussionsTable from "./RedditDiscussionsTable";
import { ConditionalContent } from "@/components/conditional-content";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SearchResultsProps {
  isLoading: boolean;
  posts: RedditPost[];
  insights: InsightsResponse | null;
  searchInProgress?: boolean;
  progressBarOnly?: boolean;
  showResults?: boolean;
}

// Render progress bar when search is in progress
const ProgressBar = ({
  searchProgress,
  searchStage,
}: {
  searchProgress: number;
  searchStage: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full mb-4 max-w-md mx-auto">
      <div className="w-full rounded-full h-2.5">
        <Progress value={searchProgress * 100} />
      </div>
      {searchStage ? (
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{searchStage}...</span>
          <Badge className="text-sm font-medium">
            {Math.round(searchProgress * 100)}%
          </Badge>
        </div>
      ) : null}
    </div>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({
  isLoading,
  posts,
  insights,
  searchInProgress = false,
  progressBarOnly = false,
  showResults = true,
}) => {
  const t = useTranslations("search");
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(
    null,
  );
  const [supportingPosts, setSupportingPosts] = useState<RedditPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState("");

  // Server-Sent Events (SSE) connection for search progress updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (searchInProgress) {
      // Create SSE connection
      const sseUrl = `/${window.location.pathname.split("/")[1]}/api/progress`;
      console.log(`Connecting to SSE endpoint: ${sseUrl}`);
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log("SSE connection established");
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.progress !== undefined) {
            setSearchProgress(data.progress);
          }
          if (data.stage) {
            setSearchStage(data.stage);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        // Auto-reconnect is handled by the browser
      };
    }

    // Clean up SSE connection when component unmounts or search is complete
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [searchInProgress]);

  const handleViewDetails = async (ideaIndex: number) => {
    if (!insights) return;

    const idea = insights.potentialSaasIdeas[ideaIndex];
    setSelectedIdeaIndex(ideaIndex);

    if (idea?.supportingPostIds.length === 0) {
      // No supporting posts
      setSupportingPosts([]);
      return;
    }

    setLoadingPosts(true);

    try {
      // Fix the fetch request
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supportingPostIds: idea?.supportingPostIds,
          allPosts: posts, // Include posts in the request body instead of as URL parameter
        }),
      });

      const data = await response.json();
      setSupportingPosts(data.posts);
    } catch (error) {
      console.error("Error fetching supporting posts:", error);
      setSupportingPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedIdeaIndex(null);
    setSupportingPosts([]);
  };

  // Only return null if there are no posts AND search is not in progress
  if (!posts?.length && !searchInProgress) {
    return null;
  }

  if (progressBarOnly) {
    return (
      <ProgressBar searchProgress={searchProgress} searchStage={searchStage} />
    );
  }

  return (
    <div className="flex flex-col py-4 max-w-3xl w-full mx-auto">
      {searchInProgress ? (
        <ProgressBar
          searchProgress={searchProgress}
          searchStage={searchStage}
        />
      ) : null}
      {showResults && !isLoading && insights?.potentialSaasIdeas?.length && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-4">{`${t("results")}:`}</h2>
          {insights?.potentialSaasIdeas.map((idea, index) => (
            <SaasIdeaCard
              key={index}
              idea={idea}
              isSelected={selectedIdeaIndex === index}
              onViewDetails={() => handleViewDetails(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
