"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";

export default function IdeasPage() {
  const { loading } = useUser();

  // Check if the user is loaded
  if (!loading) {
    return <div>Loading...</div>;
  }

  // Sample ideas data
  const ideas = [
    {
      id: 1,
      title: "AI-powered productivity assistant",
      description:
        "A smart assistant that helps users manage their tasks and schedule by analyzing their work patterns and suggesting optimizations.",
      tags: ["AI", "Productivity", "SaaS"],
      createdAt: "2025-02-28",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Remote team collaboration platform",
      description:
        "A platform designed specifically for remote teams to collaborate more effectively with virtual workspaces and integrated tools.",
      tags: ["Collaboration", "Remote Work", "Teams"],
      createdAt: "2025-03-01",
      status: "New",
    },
    {
      id: 3,
      title: "Unified subscription manager",
      description:
        "An app that helps users track and manage all their subscriptions in one place, with reminders for renewals and suggestions for cost-saving.",
      tags: ["Finance", "Personal", "Management"],
      createdAt: "2025-02-20",
      status: "Researching",
    },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-end">
        <Button className="gap-1">
          <PlusIcon className="h-4 w-4" />
          New Idea
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <Card key={idea.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{idea.title}</CardTitle>
              <CardDescription>Created on {idea.createdAt}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{idea.description}</p>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Badge
                variant={
                  idea.status === "New"
                    ? "default"
                    : idea.status === "In Progress"
                    ? "outline"
                    : "secondary"
                }
              >
                {idea.status}
              </Badge>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
