import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import {
  routerNode,
  specAgentNode,
  specToolsNode,
  specGeneratorNode,
  qaAgentNode,
  qaToolsNode,
  groomerAgentNode,
  groomerToolsNode,
} from './nodes';

// --- Logic Rẽ Nhánh ---

// 1. Từ Router đi đâu?
function routeFromSupervisor(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMsg = messages[messages.length - 1];
  try {
    const decision = JSON.parse(lastMsg.content as string);
    console.log('🚀 Router Decision:', decision);
    return decision.destination;
  } catch (e) {
    return 'project_qa'; // Fallback an toàn
  }
}

// 2. Agent có gọi tool không?
function routeToolCall(
  state: typeof MessagesAnnotation.State,
  toolsNodeName: string,
  endNodeName: string = '__end__',
) {
  const lastMsg = state.messages[state.messages.length - 1];
  // @ts-expect-error - tool_calls property may not exist on message type
  if (lastMsg.tool_calls?.length > 0) {
    return toolsNodeName;
  }
  return endNodeName;
}

// --- Xây dựng Graph ---
const workflow = new StateGraph(MessagesAnnotation)
  // Các Node
  .addNode('router', routerNode)

  // Nhánh Spec
  .addNode('spec_writer', specAgentNode)
  .addNode('spec_tools', specToolsNode)
  .addNode('spec_generator', specGeneratorNode) // Bước cuối để ra JSON

  // Nhánh QA
  .addNode('project_qa', qaAgentNode)
  .addNode('qa_tools', qaToolsNode)

  // Nhánh Groomer
  .addNode('backlog_groomer', groomerAgentNode)
  .addNode('groomer_tools', groomerToolsNode)

  // --- Các Edges (Dây nối) ---

  .addEdge('__start__', 'router')

  // Router phân loại
  .addConditionalEdges('router', routeFromSupervisor, {
    spec_writer: 'spec_writer',
    project_qa: 'project_qa',
    backlog_groomer: 'backlog_groomer',
  })

  // Logic Spec Writer (Agent <-> Tool -> Generator)
  .addConditionalEdges('spec_writer', (state) =>
    routeToolCall(state, 'spec_tools', 'spec_generator'),
  )
  .addEdge('spec_tools', 'spec_writer')
  .addEdge('spec_generator', '__end__')

  // Logic QA (Agent <-> Tool)
  .addConditionalEdges('project_qa', (state) => routeToolCall(state, 'qa_tools'))
  .addEdge('qa_tools', 'project_qa')

  // Logic Groomer (Agent <-> Tool)
  .addConditionalEdges('backlog_groomer', (state) => routeToolCall(state, 'groomer_tools'))
  .addEdge('groomer_tools', 'backlog_groomer');

export const superAgent = workflow.compile();
