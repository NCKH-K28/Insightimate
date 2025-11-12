import { middlewareHandler } from '@/lib/http/api-handler'
import { getAuthFromRequest } from '@/lib/auth'
import { authenticated } from '@/lib/auth/guards'
import { projectsService } from '@/features/projects/server/projects.service'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { subDays } from 'date-fns'

// // GET /api/v2/projects/:projectId/summary
// export const GET = middlewareHandler<{ projectId: string }>(
//   [authenticated],
//   async (req, { params }) => {
//     const auth = await getAuthFromRequest(req)
//     const context = { actorId: auth.user.id }
//     const { projectId } = params

//     // Load project (this will also enforce view permission inside service)
//     const project = await projectsService.getById(projectId, context)
//     if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

//     // --- Total issues ---
//     const totalIssues = await prisma.issue.count({ where: { projectId } })

//     // --- Status breakdown ---
//     const statusCounts = await prisma.issue.groupBy({
//       by: ['statusId'],
//       where: { projectId },
//       _count: { _all: true },
//     })
//     const statuses = await prisma.issueStatus.findMany({ where: { projectId } })
//     const statusData = statuses.map((s) => {
//       const grp = statusCounts.find((g) => g.statusId === s.id)
//       return {
//         status: s.id,
//         label: s.name,
//         value: grp?._count || 0,
//         fill: s.color || `var(--status-${s.name?.toLowerCase().replace(/\s+/g, '-')})`,
//       }
//     })

//     // --- Priority breakdown ---
//     const priorityCounts = await prisma.issue.groupBy({
//       by: ['priorityId'],
//       where: { projectId },
//       _count: { _all: true },
//     })
//     const priorities = await prisma.issuePriority.findMany({ where: { projectId }, orderBy: { sequence: 'asc' } })
//     const priorityChartData = priorities.map((p) => {
//       const grp = priorityCounts.find((g) => g.priorityId === p.id)
//       return { priority: p.name.toLowerCase(), issues: grp?._count || 0 }
//     })

//     // --- Burndown / Burnup: build a simple last-N-days series using issue createdAt/resolvedAt ---
//     const DAYS = 10
//     const since = subDays(new Date(), DAYS - 1)
//     const issues = await prisma.issue.findMany({
//       where: { projectId },
//       select: { createdAt: true, resolvedAt: true },
//     })

//     const burndownData: Array<{ day: string; remaining: number }> = []
//     const burnupData: Array<{ day: string; completed: number }> = []
//     for (let i = 0; i < DAYS; i++) {
//       const day = subDays(new Date(), DAYS - 1 - i)
//       const dayLabel = day.toISOString().slice(0, 10)
//       const dayEnd = new Date(day)
//       dayEnd.setHours(23, 59, 59, 999)

//       const completed = issues.filter((it) => it.resolvedAt && it.resolvedAt <= dayEnd).length
//       const createdUpTo = issues.filter((it) => it.createdAt <= dayEnd).length
//       const remaining = createdUpTo - completed

//       burndownData.push({ day: dayLabel, remaining })
//       burnupData.push({ day: dayLabel, completed })
//     }

//     // --- Quick stats ---
//     const backlog = await prisma.issue.count({ where: { projectId, sprint: { none: {} } } })
//     const bugs = await prisma.issue.count({ where: { projectId, type: { name: { contains: 'bug', mode: 'insensitive' } } } })
//     const activeSprints = await prisma.sprint.count({ where: { board: { projectId }, state: 'ACTIVE' } })

//     // --- Project overview ---
//     // `projectsService.getById` returns a project item but may not include joined workspace/lead details
//     // so load lightweight workspace and lead records explicitly to avoid type issues.
//     const workspaceObj = project.workspaceId
//       ? await prisma.workspace.findUnique({ where: { id: project.workspaceId }, select: { id: true, name: true } })
//       : null
//     const leadObj = project.leadId ? await prisma.user.findUnique({ where: { id: project.leadId }, select: { id: true, name: true, email: true } }) : null

//     const projectOverview = {
//       workspace: workspaceObj?.name ?? null,
//       lead: leadObj ? (leadObj.name ?? leadObj.email ?? null) : null,
//       startDate: project.createdAt ?? null,
//       version: null,
//     }

//     return NextResponse.json(
//       {
//         totalIssues,
//         statusData,
//         priorityChartData,
//         burndownData,
//         burnupData,
//         projectOverview,
//         quickStats: { backlog, bugs, activeSprints },
//       },
//       { status: 200 },
//     )
//   },
// )
