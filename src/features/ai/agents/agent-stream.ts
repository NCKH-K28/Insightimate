/**
 * Agent Stream Utilities
 *
 * Provides utilities for streaming between agents and chaining
 * multiple agents with shared context.
 */

import { createAgentUIStreamResponse, ToolLoopAgent, UIMessage } from 'ai';

// ===== Types =====

export interface AgentChainConfig {
  agents: ToolLoopAgent[];
  passContext?: boolean;
}

// ===== Streaming Response Helpers =====

/**
 * Create a streaming response for a single agent
 */
export function createAgentStream(config: {
  agent: ToolLoopAgent;
  messages: UIMessage[];
  signal?: AbortSignal;
}) {
  return createAgentUIStreamResponse({
    agent: config.agent,
    uiMessages: config.messages,
    abortSignal: config.signal,
  });
}

/**
 * Merge multiple readable streams into one
 * Useful for chaining agent outputs
 */
export function mergeStreams(streams: ReadableStream[]): ReadableStream {
  const readers = streams.map((s) => s.getReader());
  let currentIndex = 0;

  return new ReadableStream({
    async pull(controller) {
      while (currentIndex < readers.length) {
        const { done, value } = await readers[currentIndex].read();

        if (done) {
          currentIndex++;
          continue;
        }

        controller.enqueue(value);
        return;
      }

      controller.close();
    },

    cancel() {
      readers.forEach((reader) => reader.cancel());
    },
  });
}

// ===== Event Emitter Pattern for Agent Communication =====

type AgentEventType = 'step_start' | 'step_complete' | 'agent_complete' | 'error';

interface AgentEvent {
  type: AgentEventType;
  agentName: string;
  data?: unknown;
  error?: Error;
}

export class AgentEventBus {
  private listeners: Map<AgentEventType, Array<(event: AgentEvent) => void>> = new Map();

  on(type: AgentEventType, listener: (event: AgentEvent) => void) {
    const existing = this.listeners.get(type) || [];
    this.listeners.set(type, [...existing, listener]);

    return () => {
      const current = this.listeners.get(type) || [];
      this.listeners.set(
        type,
        current.filter((l) => l !== listener),
      );
    };
  }

  emit(event: AgentEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach((listener) => listener(event));
  }
}

// Global event bus for agent communication
export const agentEventBus = new AgentEventBus();
