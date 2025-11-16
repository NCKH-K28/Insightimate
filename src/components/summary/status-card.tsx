"use client"

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { PieChart, Pie } from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const statusChartConfig = {
  value: { label: 'Issues' },
}

const StatusCard: React.FC<{statusData: any[]; totalIssues: number}> = ({ statusData, totalIssues }) => {
  return (
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
            <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={40} outerRadius={60} label />
          </PieChart>
        </ChartContainer>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {statusData?.map((s: any) => {
            const pieTotal = totalIssues || 1
            const color = s.fill ?? `var(--status-${String(s.label).toLowerCase().replace(/\s+/g, '-')})`
            return (
              <div key={s.status} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="truncate">{s.label}</span>
                <span className="ml-auto text-muted-foreground">{Math.round(((s.value || 0) / pieTotal) * 100)}%</span>
              </div>
            )
          })}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 4.6% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Showing total issues grouped by status</div>
      </CardFooter>
    </Card>
  )
}

export default StatusCard
