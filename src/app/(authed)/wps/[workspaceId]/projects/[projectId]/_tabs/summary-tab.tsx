"use client"

import React from "react"
import { TrendingUp } from "lucide-react"
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  LabelList,
} from "recharts"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// ========================
// DỮ LIỆU DEMO
// ========================
const statusData = [
  { status: "todo", label: "To Do", value: 12, fill: "var(--color-todo)" },
  { status: "inprogress", label: "In Progress", value: 8, fill: "var(--color-inprogress)" },
  { status: "review", label: "Review", value: 4, fill: "var(--color-review)" },
  { status: "done", label: "Done", value: 24, fill: "var(--color-done)" },
]

const totalIssues = statusData.reduce((s, d) => s + d.value, 0)

// Bar chart priority: 5 mức Lowest → Highest
const priorityChartData = [
  { priority: "lowest", issues: 3 },
  { priority: "low", issues: 8 },
  { priority: "medium", issues: 14 },
  { priority: "high", issues: 6 },
  { priority: "highest", issues: 2 },
]

// Burndown/Burnup (demo)
const burndownData = [
  { day: "Day 1", remaining: 40 },
  { day: "Day 3", remaining: 34 },
  { day: "Day 5", remaining: 28 },
  { day: "Day 7", remaining: 20 },
  { day: "Day 9", remaining: 12 },
  { day: "Day 10", remaining: 8 },
]

const burnupData = [
  { day: "Day 1", completed: 0 },
  { day: "Day 3", completed: 8 },
  { day: "Day 5", completed: 16 },
  { day: "Day 7", completed: 25 },
  { day: "Day 9", completed: 32 },
  { day: "Day 10", completed: 40 },
]

// ========================
// CONFIG CHART
// ========================

// Config cho Pie (status)
const statusChartConfig = {
  value: { label: "Issues" },
  todo: { label: "To Do", color: "var(--chart-1)" },
  inprogress: { label: "In Progress", color: "var(--chart-2)" },
  review: { label: "Review", color: "var(--chart-3)" },
  done: { label: "Done", color: "var(--chart-4)" },
} satisfies ChartConfig

// Config cho Bar (priority)
const priorityChartConfig = {
  issues: { label: "Issues" },
  lowest: { label: "Lowest", color: "var(--chart-1)" },
  low: { label: "Low", color: "var(--chart-2)" },
  medium: { label: "Medium", color: "var(--chart-3)" },
  high: { label: "High", color: "var(--chart-4)" },
  highest: { label: "Highest", color: "var(--chart-5)" },
} satisfies ChartConfig

// ========================
// COMPONENTS PHỤ
// ========================
function StatCard({
  title,
  value,
  delta,
}: {
  title: string
  value: React.ReactNode
  delta?: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {delta && <CardDescription>{delta}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

// ========================
// MAIN
// ========================
export const SummaryTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* MAIN CONTENT */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        {/* SIMPLE NUM STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Issues" value={49} delta="Last 30 days" />
          <StatCard title="To Do" value={12} delta="Currently open" />
          <StatCard title="In Progress" value={8} delta="Active items" />
          <StatCard title="Completed" value={24} delta="Closed this month" />
        </div>

        {/* CHARTS: STATUS (PIE) + PRIORITY (BAR) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Pie chart theo mẫu ChartContainer + Tooltip */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Issues by Status</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={statusChartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={40}
                    outerRadius={60}
                    label
                  />
                </PieChart>
              </ChartContainer>
              {/* Legend with percentage */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {statusData.map((s) => (
                  <div key={s.status} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: `var(--${s.status})` || s.fill }} />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto text-muted-foreground">{Math.round((s.value / totalIssues) * 100)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by 4.6% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing total issues grouped by status
              </div>
            </CardFooter>
          </Card>

          {/* Bar chart Priority theo mẫu "mixed bar chart" (layout vertical) */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Priority</CardTitle>
              <CardDescription>Distribution by priority (Last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={priorityChartConfig}>
                <BarChart
                  accessibilityLayer
                  data={priorityChartData}
                  layout="vertical"
                  margin={{ left: 0 }}
                >
                  <YAxis
                    dataKey="priority"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) =>
                      priorityChartConfig[value as keyof typeof priorityChartConfig]?.label
                    }
                  />
                  <XAxis dataKey="issues" type="number" hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="issues" layout="vertical" radius={5} fill="#3b82f6">
                    <LabelList dataKey="issues" position="right" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Trending up by 3.1% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing total issues grouped by priority
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className="lg:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Quick summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Workspace</span>
                <span className="font-semibold">Insight Team</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Project Lead</span>
                <span className="font-semibold">Nguyễn Hữu Hưng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <span className="font-semibold">2024-07-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="font-semibold">v1.3.2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Snapshot overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Backlog</span>
                <span className="font-semibold">46</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bugs</span>
                <span className="font-semibold">7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Sprints</span>
                <span className="font-semibold">1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

export default SummaryTab
