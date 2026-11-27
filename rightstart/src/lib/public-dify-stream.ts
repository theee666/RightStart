import { ReasoningFilter } from './assistant-answer';
import { SSEParser, type DifyEvent } from './sse';

type UpstreamEvent = DifyEvent & Record<string, unknown>;

/** Allowlist output: node inputs/outputs, prompts, thoughts and metadata never leave the server. */
export class PublicDifyEvents {
  private filter = new ReasoningFilter();
  private ids: Record<string, string> = {};
  private ended = false;
  constructor(private emit: (event: DifyEvent) => void) {}

  accept(event: UpstreamEvent) {
    if (this.ended) return;
    if (['message', 'agent_message', 'message_replace', 'message_end'].includes(event.event)) {
      for (const key of ['conversation_id', 'message_id', 'id', 'task_id']) {
        if (typeof event[key] === 'string') this.ids[key] = event[key];
      }
      if (event.event === 'message_end') {
        this.filter.finish();
        this.emit({ ...this.ids, event: 'message_end' });
        this.ended = true;
      } else {
        if (event.event === 'message_replace') this.filter = new ReasoningFilter();
        const answer = this.filter.push(typeof event.answer === 'string' ? event.answer : '');
        // Empty frames still convey the real conversation ID without exposing hidden text.
        this.emit({
          ...this.ids,
          event: event.event === 'message_replace' ? 'message_replace' : 'message',
          answer,
        });
      }
    } else if (
      event.event === 'error' ||
      (event.event === 'workflow_finished' && event.data?.status === 'failed')
    ) {
      this.emit({ event: 'error', message: 'AI 服务执行失败，请稍后重试。' });
      this.ended = true;
    }
  }

  finish() {
    this.filter.finish();
  }
}

export function publicDifyStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval>;
  let output: ReadableStreamDefaultController<Uint8Array>;
  const filter = new PublicDifyEvents((event) => {
    output.enqueue(encoder.encode('data: ' + JSON.stringify(event) + '\n\n'));
  });
  const parser = new SSEParser((event) => filter.accept(event as UpstreamEvent));
  function cleanup() {
    closed = true;
    clearInterval(heartbeat);
    filter.finish();
  }
  return new ReadableStream<Uint8Array>({
    start(controller) {
      output = controller;
      controller.enqueue(encoder.encode(': connected\n\n'));
      // A timer is required: Dify may stay silent during retrieval or model reasoning.
      heartbeat = setInterval(() => {
        if (!closed && (controller.desiredSize ?? 0) > 0)
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 10000);
    },
    async pull(controller) {
      try {
        // Respect downstream backpressure while still reading private upstream frames.
        while (!closed && (controller.desiredSize ?? 0) > 0) {
          const { done, value } = await reader.read();
          if (closed) return;
          if (done) {
            parser.feed(decoder.decode());
            parser.finish();
            cleanup();
            reader.releaseLock();
            controller.close();
            return;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch {
        if (closed) return;
        cleanup();
        // Never expose upstream error bodies, prompts, or internal reasoning.
        controller.enqueue(encoder.encode('data: {"event":"error","message":"AI 回复连接中断或超时，请稍后重试。"}\n\n'));
        controller.close();
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      cleanup();
      try {
        await reader.cancel(reason);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
