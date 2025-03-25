import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoveRight, RefreshCw } from "lucide-react"

import data from "./data.json"

export default function Page() {
  return (
    <Card className="w-full max-w-4xl mx-auto mb-8 sm:max-w-6xl sm:mx-auto md:max-w-8xl md:mx-auto lg:max-w-10xl lg:mx-auto">
      {/* Dashboard header with welcome message */}
      <CardHeader className="border-b bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your account activity and data.
          </p>
        </div>
      </CardHeader>

      {/* Dashboard content */}
      <div className="flex-1 overflow-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Quick stats section */}
        <section aria-labelledby="stats-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="stats-heading" className="text-lg font-semibold">
              Quick Stats
            </h2>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="[&>div]:grid-cols-1 sm:[&>div]:grid-cols-2 md:[&>div]:grid-cols-3 lg:[&>div]:grid-cols-4 [&_.card-footer]:pt-0 [&_.card-footer]:text-xs [&_.card-header]:pb-2 [&_svg.size-4]:size-3">
            <SectionCards />
          </div>
        </section>

        {/* Analytics section with tabs */}
        <section aria-labelledby="analytics-heading">
          <div className="mb-4">
            <h2 id="analytics-heading" className="text-lg font-semibold">
              Analytics Overview
            </h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                View your performance metrics over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="space-y-4">
                  <div className="h-[350px]">
                    <ChartAreaInteractive />
                  </div>
                </TabsContent>
                <TabsContent value="weekly" className="space-y-4">
                  <div className="h-[350px]">
                    <ChartAreaInteractive />
                  </div>
                </TabsContent>
                <TabsContent value="monthly" className="space-y-4">
                  <div className="h-[350px]">
                    <ChartAreaInteractive />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Data table section */}
        <section aria-labelledby="recent-activities-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-activities-heading" className="text-lg font-semibold">
              Recent Activities
            </h2>
            <Button variant="link" size="sm" className="gap-1 text-primary">
              View all
              <MoveRight className="h-4 w-4" />
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                A detailed log of all recent activities on your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable data={data} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Your Company. All rights reserved.
          </p>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Help
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
          </nav>
        </div>
      </div>
    </Card>
  )
}
