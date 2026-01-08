import { tool } from '@langchain/core/tools';
import { TavilySearch } from '@langchain/tavily';
import { z } from 'zod';

// ------------------------------
// Tools (stable names, stable schemas)
// ------------------------------

// --- Mock DB & Data ---
const MOCK_TASKS = [
  {
    id: 'TASK-1',
    title: 'Fix Login Bug',
    status: 'TODO',
    assignee: 'Minh',
    desc: 'Lỗi 500 khi login',
  },
  {
    id: 'TASK-2',
    title: 'Setup Prisma',
    status: 'DONE',
    assignee: 'Nam',
    desc: 'Cài đặt DB schema',
  },
];

// --- TOOL 1: Search Web (Cho Spec Writer) ---
// Cần biến môi trường TAVILY_API_KEY
const tavily = new TavilySearch({ maxResults: 5, topic: 'general' });

export const webSearchTool = tool(
  async ({ query }: { query: string }) => {
    const res = await tavily.invoke({ query });
    return res;
  },
  {
    name: 'web_search',
    description:
      'Search the web for latest documentation/specs (versions, APIs, integrations, uncommon libs). Return short, actionable findings.',
    schema: z.object({ query: z.string().min(3) }),
  },
);
// --- TOOL 2: Read Tech Stack (Cho Spec & Groomer) ---
export const readTechStackTool = tool(
  async () =>
    JSON.stringify({
      framework: 'Next.js 15',
      database: 'PostgreSQL',
      orm: 'Prisma',
      auth: 'NextAuth v5',
    }),
  { name: 'read_tech_stack', description: 'Đọc thông tin công nghệ dự án.', schema: z.object({}) },
);

// --- TOOL 3: Query Tasks (Cho QA) ---
export const getTasksTool = tool(
  async ({ status, assignee }) => {
    // Thực tế: return await prisma.task.findMany({ where: { status, assignee } })
    let results = MOCK_TASKS;
    if (status) results = results.filter((t) => t.status === status);
    if (assignee) results = results.filter((t) => t.assignee.includes(assignee));
    return JSON.stringify(results);
  },
  {
    name: 'get_tasks',
    description: 'Tìm danh sách task theo trạng thái hoặc người làm.',
    schema: z.object({
      status: z.string().optional(),
      assignee: z.string().optional(),
    }),
  },
);

// --- TOOL 4: Read Specific Task (Cho Groomer) ---
export const readTaskDetailTool = tool(
  async ({ taskId }) => {
    // Thực tế: return await prisma.task.findUnique({ where: { id: taskId } })
    const task = MOCK_TASKS.find((t) => t.id === taskId || t.title.includes(taskId));
    if (!task) return 'Không tìm thấy task.';
    return JSON.stringify(task);
  },
  {
    name: 'read_task_detail',
    description: 'Đọc nội dung chi tiết của một task cụ thể để sửa đổi.',
    schema: z.object({ taskId: z.string() }),
  },
);
