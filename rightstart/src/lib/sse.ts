export type DifyEvent = {
  event: string;
  answer?: string;
  conversation_id?: string;
  message?: string;
  status?: number;
  data?: { status?: string; error?: string };
};
export class SSEParser {
  private buffer = '';
  constructor(private onEvent: (event: DifyEvent) => void) {}
  feed(chunk: string) {
    this.buffer += chunk;
    let match: RegExpExecArray | null;
    while ((match = /\r?\n\r?\n/.exec(this.buffer))) {
      const frame = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      const data = frame
        .split(/\r?\n/)
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart())
        .join('\n');
      if (!data || data === '[DONE]') continue;
      let event: DifyEvent;
      try {
        event = JSON.parse(data);
      } catch {
        throw new Error('AI 返回的数据格式异常，请重试。');
      }
      this.onEvent(event);
    }
  }
  finish() {
    if (this.buffer.trim()) this.feed('\n\n');
  }
}
