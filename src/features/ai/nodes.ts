import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ProjectPlanSchema, RouteDecisionSchema } from './schemas';
import {
  webSearchTool,
  readTechStackTool,
  getTasksTool,
  readTaskDetailTool,
} from './tools/raw-tool';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// --- Models ---
const llm = new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash', temperature: 0.2 });

// ==========================================================
// 1. ROUTER NODE (Người điều phối)
// ==========================================================
export async function routerNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const structuredLLM = llm.withStructuredOutput(RouteDecisionSchema);

  const sysMsg = new SystemMessage(`
    Bạn là Router thông minh. Phân tích yêu cầu và chọn chuyên gia phù hợp:
    - 'spec_writer': Nếu user muốn tạo tính năng mới, lên kế hoạch, "làm thế nào để...".
    - 'project_qa': Nếu user hỏi "tiến độ", "ai đang làm gì", tra cứu task.
    - 'backlog_groomer': Nếu user muốn "sửa task", "viết lại mô tả", "tối ưu task".
  `);

  const decision = await structuredLLM.invoke([sysMsg, ...messages]);

  // Trả về một message đặc biệt chứa quyết định để Graph đọc
  return {
    messages: [
      new HumanMessage({
        content: JSON.stringify(decision),
        id: 'ROUTER_DECISION',
      }),
    ],
  };
}

// ==========================================================
// 2. SPEC WRITER NODE (Architect)
// ==========================================================
const specTools = [webSearchTool, readTechStackTool];
const specModel = llm.bindTools(specTools);

export async function specAgentNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const sysMsg = new SystemMessage(`
    Bạn là Architect. Nhiệm vụ: Tạo kế hoạch chi tiết (PRD).
    1. Kiểm tra Tech Stack trước.
    2. Nếu cần, search web tìm tài liệu.
    3. Cuối cùng, trả về JSON kế hoạch chuẩn (ProjectPlanSchema).
  `);

  // Logic: Nếu message cuối là tool result, AI sẽ tiếp tục suy nghĩ
  const response = await specModel.invoke([sysMsg, ...messages]);
  return { messages: [response] };
}
export const specToolsNode = new ToolNode(specTools);

// Generator: Bước cuối để ép ra JSON
export async function specGeneratorNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const structuredLLM = llm.withStructuredOutput(ProjectPlanSchema);
  const response = await structuredLLM.invoke(messages);
  return { messages: [{ role: 'assistant', content: JSON.stringify(response) }] };
}

// ==========================================================
// 3. QA NODE (Keeper)
// ==========================================================
const qaTools = [getTasksTool]; // Thêm getStatsTool nếu muốn
const qaModel = llm.bindTools(qaTools);

export async function qaAgentNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const sysMsg = new SystemMessage(
    'Bạn là Project Keeper. Dùng tool tra cứu DB để trả lời câu hỏi về tiến độ.',
  );
  const response = await qaModel.invoke([sysMsg, ...messages]);
  return { messages: [response] };
}
export const qaToolsNode = new ToolNode(qaTools);

// ==========================================================
// 4. BACKLOG GROOMER NODE (Fixer)
// ==========================================================
const groomerTools = [readTaskDetailTool, readTechStackTool];
const groomerModel = llm.bindTools(groomerTools);

export async function groomerAgentNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const sysMsg = new SystemMessage(`
    Bạn là Senior QA. Nhiệm vụ: Tinh chỉnh và viết lại task cho rõ ràng.
    1. Dùng tool 'read_task_detail' để đọc nội dung cũ.
    2. Viết lại Description chuyên nghiệp, thêm Acceptance Criteria.
  `);
  const response = await groomerModel.invoke([sysMsg, ...messages]);
  return { messages: [response] };
}
export const groomerToolsNode = new ToolNode(groomerTools);
