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
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let output: TransformStreamDefaultController<Uint8Array>;
  const filter = new PublicDifyEvents((event) => {
    output.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  });
  const parser = new SSEParser((event) => filter.accept(event as UpstreamEvent));
  return source.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        output = controller;
        try {
          parser.feed(decoder.decode(chunk, { stream: true }));
          // Keep the connection alive even when the upstream sends only private workflow events.
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          controller.enqueue(
            encoder.encode('data: {"event":"error","message":"AI 回复数据异常，请重新提问。"}\n\n'),
          );
          controller.terminate();
        }
      },
      flush(controller) {
        output = controller;
        try {
          parser.feed(decoder.decode());
          parser.finish();
          filter.finish();
        } catch {
          controller.enqueue(
            encoder.encode('data: {"event":"error","message":"AI 回复连接中断。"}\n\n'),
          );
        }
      },
    }),
  );
}
