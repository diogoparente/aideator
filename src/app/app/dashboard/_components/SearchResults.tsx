import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// Add missing component imports
import SaasIdeaCard from "./SaasIdeaCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { InsightsResponse } from "@/app/api/deepseek/deepseekApi";
import { RedditPost } from "@/app/api/reddit/redditApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

const IdeaDetailsDialog = ({
  idea,
  supportingPosts,
  loadingPosts,
  open,
  onOpenChange,
}: {
  idea: InsightsResponse["potentialSaasIdeas"][0] | null;
  supportingPosts: RedditPost[];
  loadingPosts: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!idea) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{idea.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{idea.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Target Audience</h3>
              <p className="text-muted-foreground">{idea.targetAudience}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Potential Features</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {idea.potentialFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Validation Steps</h3>
              <ul className="list-decimal pl-5 text-muted-foreground">
                {idea.validationSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Supporting Evidence</h3>
              {loadingPosts ? (
                <p className="text-muted-foreground">
                  Loading supporting posts...
                </p>
              ) : supportingPosts.length > 0 ? (
                <div className="space-y-4">
                  {supportingPosts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-1">{post.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        r/{post.subreddit} • {post.score} points •{" "}
                        {post.num_comments} comments
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.selftext}
                      </p>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View on Reddit →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No supporting posts found.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxReconnectAttempts = 3;
  const reconnectAttemptRef = useRef(0);
  const keepAliveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Server-Sent Events (SSE) connection for search progress updates
  useEffect(() => {
    let mounted = true;

    const connectSSE = () => {
      if (!searchInProgress || !mounted) return;

      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Clear any existing timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (keepAliveTimeoutRef.current) {
          clearTimeout(keepAliveTimeoutRef.current);
        }

        // Create SSE connection
        const locale = window.location.pathname.split("/")[1] || "en";
        const sseUrl = `/api/progress`;
        console.log("Connecting to SSE endpoint:", sseUrl);

        const options: EventSourceInit = {
          withCredentials: true,
        };

        eventSourceRef.current = new EventSource(sseUrl, options);

        // Set up keep-alive ping to prevent connection timeout
        const setupKeepAlive = () => {
          if (keepAliveTimeoutRef.current) {
            clearTimeout(keepAliveTimeoutRef.current);
          }
          keepAliveTimeoutRef.current = setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.OPEN) {
              console.log("Sending keep-alive ping...");
              // Send a ping to keep the connection alive
              fetch(`${sseUrl}/ping`).catch(() => {
                // Ignore ping errors
              });
              setupKeepAlive();
            }
          }, 30000); // Ping every 30 seconds
        };

        eventSourceRef.current.onopen = () => {
          console.log("SSE connection established");
          reconnectAttemptRef.current = 0; // Reset reconnect attempts on successful connection
          setupKeepAlive(); // Start keep-alive pings
        };

        eventSourceRef.current.onmessage = (event) => {
          if (!mounted) return;

          try {
            const data = JSON.parse(event.data);

            // Reset keep-alive timer on any message
            setupKeepAlive();

            if (data.progress !== undefined) {
              setSearchProgress(data.progress);
            }
            if (data.stage) {
              setSearchStage(data.stage);
            }
            if (data.done) {
              // Clean up connection when search is complete
              console.log("Search complete, closing SSE connection");
              cleanup();
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error);
            toast.error("Error processing search update");
          }
        };

        eventSourceRef.current.onerror = (event) => {
          // Get connection state
          const state = eventSourceRef.current
            ? ["CONNECTING", "OPEN", "CLOSED"][
                eventSourceRef.current.readyState
              ]
            : "UNKNOWN";

          console.error("SSE connection error - State:", state, event);

          // Check if the connection was never established
          if (state === "CLOSED" && reconnectAttemptRef.current === 0) {
            console.error("Initial connection failed");
            toast.error(
              "Failed to establish connection. Please check your network connection."
            );
            cleanup();
            return;
          }

          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            // Connection is closed, attempt to reconnect if under max attempts
            if (reconnectAttemptRef.current < maxReconnectAttempts) {
              reconnectAttemptRef.current += 1;
              const delay = Math.min(
                1000 * Math.pow(2, reconnectAttemptRef.current - 1),
                10000
              ); // Exponential backoff with 10s max

              console.log(
                `Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${delay}ms...`
              );

              // Attempt to reconnect after a delay
              reconnectTimeoutRef.current = setTimeout(() => {
                if (mounted && searchInProgress) {
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
              cleanup();
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
        cleanup();
      }
    };

    const cleanup = () => {
      if (keepAliveTimeoutRef.current) {
        clearTimeout(keepAliveTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        console.log("Cleaning up SSE connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    connectSSE();

    // Cleanup function
    return () => {
      mounted = false;
      cleanup();
    };
  }, [searchInProgress]);

  const handleViewDetails = async (ideaIndex: number) => {
    if (!insights) return;

    const idea = insights.potentialSaasIdeas[ideaIndex];
    setSelectedIdeaIndex(ideaIndex);
    setDialogOpen(true);

    if (!idea?.supportingPostIds?.length) {
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
          supportingPostIds: idea.supportingPostIds,
          allPosts: posts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.posts) {
        throw new Error("No posts returned from the server");
      }

      setSupportingPosts(data.posts);
    } catch (error) {
      console.error("Error fetching supporting posts:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch supporting posts"
      );
      setSupportingPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedIdeaIndex(null);
    setSupportingPosts([]);
    setDialogOpen(false);
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
          <div className="grid grid-cols-2 xxl:grid-cols-3 gap-4">
            {insights.potentialSaasIdeas.map((idea, index: number) => (
              <SaasIdeaCard
                key={idea.name}
                idea={idea}
                onViewDetails={() => handleViewDetails(index)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <IdeaDetailsDialog
        idea={
          selectedIdeaIndex !== null && insights
            ? insights.potentialSaasIdeas[selectedIdeaIndex]
            : null
        }
        supportingPosts={supportingPosts}
        loadingPosts={loadingPosts}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) handleCloseDetails();
        }}
      />
    </div>
  );
};

export default SearchResults;
