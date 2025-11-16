"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const ProjectOverview: React.FC<{workspaceName: string; projectLead: string; startDate: string; version: string}> = ({ workspaceName, projectLead, startDate, version }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>Quick summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Workspace</span>
            <span className="font-semibold">{workspaceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Project Lead</span>
            <span className="font-semibold">{projectLead}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Start Date</span>
            <span className="font-semibold">{startDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="font-semibold">{version}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectOverview
