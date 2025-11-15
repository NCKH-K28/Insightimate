import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export default function SummaryLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-72">
            <CardHeader>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>

          <Card className="h-72">
            <CardHeader>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>

      <aside className="lg:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
