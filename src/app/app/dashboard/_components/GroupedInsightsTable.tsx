"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  ChevronDown,
  Star,
  Eye,
} from "lucide-react";
import Link from "next/link";

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

// Define the structure for SaaS ideas
interface SaasIdea {
  name: string;
  description: string;
  targetAudience: string;
  potentialFeatures: string[];
  validationSteps: string[];
}

// Define the structure for competitive landscape
interface CompetitiveLandscape {
  existingSolutions: string[];
  gaps: string[];
}

// Define the structure for implementation complexity
interface ImplementationComplexity {
  technical: string;
  market: string;
  timeToMvp: string;
}

// Define the structure for insights response
interface InsightsData {
  commonProblems: string[];
  potentialSaasIdeas: SaasIdea[];
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

interface GroupedInsightsTableProps {
  posts: RedditPost[];
  insights: InsightsData | null;
  isLoading: boolean;
}

export default function GroupedInsightsTable({
  posts,
  insights,
  isLoading,
}: GroupedInsightsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyzing Reddit Data</CardTitle>
          <CardDescription>
            Searching for relevant discussions and generating insights...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No posts found
  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
          <CardDescription>
            Try a different search query or select different subreddits.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Toggle row expansion
  const toggleRow = (index: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Reddit posts table */}
      <Card>
        <CardHeader>
          <CardTitle>Reddit Discussions</CardTitle>
          <CardDescription>
            Found {posts.length} relevant posts from Reddit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subreddit</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post, index) => (
                <>
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.subreddit}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <ThumbsUp className="mr-1 h-3 w-3" />
                          {post.score}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {post.num_comments}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(post.created_utc)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRow(index)}
                        >
                          <span className="sr-only">Details</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${expandedRows[index] ? "rotate-180" : ""}`}
                          />
                        </Button>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open</span>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows[index] && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/50">
                        <div className="py-2">
                          <p className="text-sm">{post.selftext}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Posted by {post.author}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights section */}
      {insights && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Insights & Opportunities</h2>

          {/* SaaS Ideas */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              <Lightbulb className="inline mr-2 h-5 w-5" />
              Potential SaaS Ideas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.potentialSaasIdeas.map((idea, index) => (
                <Card key={index}>
                  <CardContent className="p-4 h-full flex flex-col">
                    <h4 className="text-lg font-semibold">{idea.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {idea.description}
                    </p>
                    <div className="mt-3 text-sm">
                      <span className="font-medium">Target audience:</span>{" "}
                      {idea.targetAudience}
                    </div>
                    <div className="mt-auto pt-3 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        asChild
                      >
                        <Link
                          href={`/app/ideas/${encodeURIComponent(idea.name.toLowerCase().replace(/\s+/g, "-"))}`}
                        >
                          View Detail
                          <Eye className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Save Idea
                        <Star className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Market Trends */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Market Trends</h3>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {insights.marketTrends.map((trend, index) => (
                    <li key={index} className="text-sm">
                      • {trend}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* User Pain Points */}
          <div>
            <h3 className="text-xl font-semibold mb-4">User Pain Points</h3>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {insights.userPainPoints.map((point, index) => (
                    <li key={index} className="text-sm">
                      • {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
