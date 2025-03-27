"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, Star, CheckCheck, Code, Share2 } from "lucide-react";

export default function IdeaDetail() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id[0];
  const [ideaName, setIdeaName] = useState<string>("");

  // Format the encoded ID back to a readable name
  useEffect(() => {
    if (id) {
      const formattedName = id
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setIdeaName(formattedName);
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{ideaName}</h1>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="mr-1 h-4 w-4" /> Share
        </Button>
        <Button variant="default" size="sm">
          <Star className="mr-1 h-4 w-4" /> Save Idea
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                A detailed explanation of the {ideaName} concept and how it
                solves user pain points.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This SaaS solution targets small business owners, freelancers,
                and remote teams who need efficient project management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Client relationship management</li>
                <li>Project time tracking</li>
                <li>Invoicing integration</li>
                <li>Team collaboration tools</li>
                <li>Mobile-first experience</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Market Research</h3>
                  <p className="text-sm text-muted-foreground">
                    Survey potential users about their current pain points and
                    workflow challenges.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Competitor Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Review existing solutions and identify gaps and
                    opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCheck className="h-5 w-5 text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">MVP Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Build a minimal viable product focusing on core features.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCheck className="h-5 w-5 text-muted flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">User Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Test with a small group of target users and gather feedback.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Tech Stack</h3>
                  <p className="text-sm text-muted-foreground">
                    Next.js, React, TypeScript, Tailwind CSS, Supabase, Drizzle
                    ORM
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">API Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    RESTful API with authentication, user management, and data
                    storage endpoints.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Estimated Development Time</h3>
                  <p className="text-sm text-muted-foreground">
                    3-4 months for core functionality
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Deployment Strategy</h3>
                  <p className="text-sm text-muted-foreground">
                    Cloud-based deployment with CI/CD pipeline for continuous
                    updates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Development Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border-l-2 border-green-500 pl-3">
                  <h3 className="font-medium">Phase 1 (Month 1-2)</h3>
                  <p className="text-sm text-muted-foreground">
                    Core user management, authentication, and basic UI
                  </p>
                </div>

                <div className="border-l-2 border-yellow-500 pl-3">
                  <h3 className="font-medium">Phase 2 (Month 3)</h3>
                  <p className="text-sm text-muted-foreground">
                    Project management and time tracking features
                  </p>
                </div>

                <div className="border-l-2 border-blue-500 pl-3">
                  <h3 className="font-medium">Phase 3 (Month 4)</h3>
                  <p className="text-sm text-muted-foreground">
                    Integrations, reporting, and advanced features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Useful Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">GitHub Repositories</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                      <li>Next.js Starter Templates</li>
                      <li>React Authentication Libraries</li>
                      <li>UI Component Libraries</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Learning Resources</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                      <li>SaaS Development Best Practices</li>
                      <li>Pricing Strategy for SaaS Products</li>
                      <li>Marketing Guide for SaaS Startups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
