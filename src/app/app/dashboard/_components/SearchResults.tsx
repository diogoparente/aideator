import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { InsightsResponse } from "@/app/[locale]/api/deepseek/deepseekApi";
import { RedditPost } from "@/app/[locale]/app/dashboard/page";
import { toast } from "sonner";

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
    null
  );
  const [supportingPosts, setSupportingPosts] = useState<RedditPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStage, setSearchStage] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 3;
  const reconnectAttemptRef = useRef(0);

  // Server-Sent Events (SSE) connection for search progress updates
  useEffect(() => {
    let mounted = true;

    const connectSSE = () => {
      if (!searchInProgress || !mounted) return;

      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create SSE connection
        const locale = window.location.pathname.split("/")[1] || "en";
        const sseUrl = `/${locale}/api/progress`;
        console.log("Connecting to SSE endpoint:", sseUrl);

        eventSourceRef.current = new EventSource(sseUrl);

        eventSourceRef.current.onopen = () => {
          console.log("SSE connection established");
          reconnectAttemptRef.current = 0; // Reset reconnect attempts on successful connection
        };

        eventSourceRef.current.onmessage = (event) => {
          if (!mounted) return;

          try {
            const data = JSON.parse(event.data);
            if (data.progress !== undefined) {
              setSearchProgress(data.progress);
            }
            if (data.stage) {
              setSearchStage(data.stage);
            }
            if (data.done) {
              // Clean up connection when search is complete
              console.log("Search complete, closing SSE connection");
              eventSourceRef.current?.close();
              eventSourceRef.current = null;
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error);
            toast.error("Error processing search update");
          }
        };

        eventSourceRef.current.onerror = () => {
          // Get connection state
          const state = eventSourceRef.current
            ? ["CONNECTING", "OPEN", "CLOSED"][
                eventSourceRef.current.readyState
              ]
            : "UNKNOWN";

          console.error("SSE connection error - State:", state);

          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            // Connection is closed, attempt to reconnect if under max attempts
            if (reconnectAttemptRef.current < maxReconnectAttempts) {
              reconnectAttemptRef.current += 1;
              const delay = 1000 * Math.pow(2, reconnectAttemptRef.current - 1); // Exponential backoff

              console.log(
                `Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${delay}ms...`
              );

              // Clear any existing timeout
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
              }

              // Attempt to reconnect after a delay
              reconnectTimeoutRef.current = setTimeout(() => {
                if (mounted) {
                  connectSSE();
                }
              }, delay);

              toast.warning(
                `Connection lost. Retrying... (Attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts})`
              );
            } else {
              console.error("Max reconnection attempts reached");
              toast.error(
                "Lost connection to search updates. Please refresh the page."
              );
            }
          } else if (
            eventSourceRef.current?.readyState === EventSource.CONNECTING
          ) {
            console.log("SSE connection is attempting to connect...");
          }
        };
      } catch (error) {
        console.error("Error setting up SSE connection:", error);
        toast.error("Failed to establish connection for search updates");
      }
    };

    connectSSE();

    // Cleanup function
    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        console.log("Cleaning up SSE connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [searchInProgress]);

  const handleViewDetails = async (ideaIndex: number) => {
    if (!insights) return;

    const idea = insights.potentialSaasIdeas[ideaIndex];
    setSelectedIdeaIndex(ideaIndex);

    if (idea?.supportingPostIds.length === 0) {
      setSupportingPosts([]);
      return;
    }

    setLoadingPosts(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supportingPostIds: idea?.supportingPostIds,
          allPosts: posts,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSupportingPosts(data.posts);
    } catch (error) {
      console.error("Error fetching supporting posts:", error);
      toast.error("Failed to fetch supporting posts");
      setSupportingPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedIdeaIndex(null);
    setSupportingPosts([]);
  };

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
      {showResults && !isLoading && insights?.potentialSaasIdeas?.length ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-4">{`${t("results")}:`}</h2>
          {insights.potentialSaasIdeas.map((idea, index) => (
            <SaasIdeaCard
              key={index}
              idea={idea}
              isSelected={selectedIdeaIndex === index}
              onViewDetails={() => handleViewDetails(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchResults;
