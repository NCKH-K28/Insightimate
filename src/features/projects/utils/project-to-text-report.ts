import { ProjectImport } from '@/contracts/projects';

type UserPublic = { id: string; name: string; email: string };
type Project = ProjectImport;

// ===== Constants =====
const NA = 'N/A';
const SECTION_SEPARATOR = '';

// ===== Types =====
type Issue = NonNullable<Project['issues']>[number];
type Status = NonNullable<Project['statuses']>[number];
type IssueType = NonNullable<Project['types']>[number];
type Priority = NonNullable<Project['priorities']>[number];

interface LookupMaps {
  userById: Map<string, UserPublic>;
  statusById: Map<string, Status>;
  typeById: Map<string, IssueType>;
  priorityById: Map<string, Priority>;
}

// ===== Helper Functions =====
const createLookupMap = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((item) => [item.id, item]));

const formatDateTime = (value?: string | null): string => value ?? NA;

const formatUser = (id: string | null | undefined, userById: Map<string, UserPublic>): string => {
  if (!id) return NA;
  const user = userById.get(id);
  return user ? `${user.name} <${user.email}>` : id;
};

const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

const countBy = <T, K extends keyof T>(items: T[], key: K): Record<string, number> =>
  items.reduce(
    (acc, item) => {
      const value = item[key];
      if (value != null) {
        const strValue = String(value);
        acc[strValue] = (acc[strValue] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

// ===== Section Builders =====
const buildHeader = (project: Project): string[] => [
  `=== Project Report: ${project.name} (${project.key}) ===`,
  SECTION_SEPARATOR,
];

const buildGeneralInfo = (
  project: Project,
  formatUserFn: (id: string | null | undefined) => string,
): string[] => [
  'I. Thông tin chung',
  `- ID: ${project.id}`,
  `- Tên: ${project.name}`,
  `- Key: ${project.key}`,
  `- Leader: ${formatUserFn(project.leadId)}`,
  `- Mô tả: ${project.description ?? NA}`,
  // `- Created At: ${formatDateTime(project.createdAt)}`,
  // `- Updated At: ${formatDateTime(project.updatedAt)}`,
  SECTION_SEPARATOR,
];

const buildActorsSection = (
  actors: Project['actors'],
  formatUserFn: (id: string | null | undefined) => string,
): string[] => {
  if (!actors?.length) return [];

  const actorLines = actors.map((actor, idx) => {
    const label =
      actor.actorType === 'USER' ? formatUserFn(actor.actorId) : `Team: ${actor.actorId}`;
    return `  ${idx + 1}. [${actor.actorType}] ${label}`;
  });

  return ['II. Actors', ...actorLines, SECTION_SEPARATOR];
};

const buildIssueStats = (
  project: Project,
  issues: Issue[],
  formatUserFn: (id: string | null | undefined) => string,
): string[] => {
  const lines: string[] = ['III. Thống kê Issues', `- Tổng số issues: ${issues.length}`];

  const countByStatus = countBy(issues, 'statusId');
  const countByType = countBy(issues, 'typeId');
  const countByAssignee = countBy(issues, 'assigneeId');

  // By Status
  if (project.statuses && project.statuses.length > 0) {
    lines.push('- Issues theo trạng thái:');
    project.statuses.forEach((status) => {
      const count = countByStatus[status.id] ?? 0;
      lines.push(`  • ${status.name} [${status.category}]: ${count} issue(s)`);
    });
  }

  // By Type
  if (project.types && project.types.length > 0) {
    lines.push('- Issues theo loại:');
    project.types.forEach((type) => {
      const count = countByType[type.id] ?? 0;
      lines.push(`  • ${type.name} (hierarchy=${type.hierarchy}): ${count}`);
    });
  }

  // By Assignee
  const assigneeEntries = Object.entries(countByAssignee).sort(([, a], [, b]) => b - a);
  if (assigneeEntries.length > 0) {
    lines.push('- Issues theo assignee:');
    assigneeEntries.forEach(([assigneeId, count]) => {
      lines.push(`  • ${formatUserFn(assigneeId)}: ${count} issue(s)`);
    });
  }

  lines.push(SECTION_SEPARATOR);
  return lines;
};

const formatSingleIssue = (
  issue: Issue,
  index: number,
  maps: LookupMaps,
  formatUserFn: (id: string | null | undefined) => string,
): string[] => {
  const status = issue.statusId ? maps.statusById.get(issue.statusId) : undefined;
  const type = issue.typeId ? maps.typeById.get(issue.typeId) : undefined;
  const priority = issue.priorityId ? maps.priorityById.get(issue.priorityId) : undefined;

  const lines = [
    `  ${index + 1}. [${issue.id}] ${issue.summary}`,
    `     - Loại: ${type?.name ?? NA} | Trạng thái: ${
      status?.name ?? NA
    } | Priority: ${priority?.name ?? NA}`,
    `     - Reporter: ${formatUserFn(
      issue.reporterId,
    )} | Assignee: ${formatUserFn(issue.assigneeId)}`,
    `     - Story points: ${issue.storyPoints ?? NA} | Parent: ${issue.parentId ?? NA}`,
    `     - Dates: start=${formatDateTime(
      issue.startDate,
    )}, due=${formatDateTime(issue.dueDate)}, resolved=${formatDateTime(issue.resolvedAt)}`,
  ];

  if (issue.description) {
    lines.push(`     - Mô tả: ${truncateText(issue.description, 120)}`);
  }

  return lines;
};

const buildIssuesList = (
  issues: Issue[],
  maps: LookupMaps,
  formatUserFn: (id: string | null | undefined) => string,
): string[] => {
  if (issues.length === 0) {
    return ['IV. Danh sách Issues: (không có issue nào)'];
  }

  const issueLines = issues.flatMap((issue, index) =>
    issue ? formatSingleIssue(issue, index, maps, formatUserFn) : [],
  );

  return ['IV.  Danh sách Issues (rút gọn):', ...issueLines];
};

// ===== Main Function =====
export function projectToTextReport(project: Project, users: UserPublic[]): string {
  // Build lookup maps once
  const maps: LookupMaps = {
    userById: createLookupMap(users),
    statusById: createLookupMap(project.statuses ?? []),
    typeById: createLookupMap(project.types ?? []),
    priorityById: createLookupMap(project.priorities ?? []),
  };

  // Curry formatUser with userById map
  const formatUserFn = (id: string | null | undefined) => formatUser(id, maps.userById);

  const issues = (project.issues ?? []).filter(Boolean) as Issue[];

  // Build all sections
  const sections = [
    ...buildHeader(project),
    ...buildGeneralInfo(project, formatUserFn),
    ...buildActorsSection(project.actors, formatUserFn),
    ...buildIssueStats(project, issues, formatUserFn),
    ...buildIssuesList(issues, maps, formatUserFn),
  ];

  return sections.join('\n');
}
