/** Incremental filter: a possible marker prefix is never released to the client. */
export class ReasoningFilter {
  private buffer = '';
  private depth = 0;
  private comment = false;
  private readonly prefixes = [
    ...['think', 'thinking', 'analysis', 'reasoning'].flatMap((name) => [
      `<${name}`,
      `</${name}`,
      `&lt;${name}`,
      `&lt;/${name}`,
    ]),
    '<!--',
    '<|begin_of_thought|>',
    '<|end_of_thought|>',
  ];

  push(chunk: string): string {
    this.buffer += chunk;
    let visible = '';
    while (this.buffer) {
      if (this.comment) {
        const end = this.buffer.indexOf('-->');
        if (end < 0) {
          this.buffer = this.buffer.slice(-2);
          break;
        }
        this.buffer = this.buffer.slice(end + 3);
        this.comment = false;
        continue;
      }
      const next = this.buffer.search(/[<&]/);
      if (next < 0) {
        if (!this.depth) visible += this.buffer;
        this.buffer = '';
        break;
      }
      if (next > 0) {
        if (!this.depth) visible += this.buffer.slice(0, next);
        this.buffer = this.buffer.slice(next);
      }
      if (this.buffer.startsWith('<!--')) {
        this.comment = true;
        this.buffer = this.buffer.slice(4);
        continue;
      }
      const tag =
        /^(?:<(\/?)(?:think|thinking|analysis|reasoning)\b[^>]*>|&lt;(\/?)(?:think|thinking|analysis|reasoning)\b(?:(?!&gt;).)*&gt;|<\|(begin|end)_of_thought\|>)/i.exec(
          this.buffer,
        );
      if (tag) {
        const closing = !!tag[1] || !!tag[2] || tag[3]?.toLowerCase() === 'end';
        this.depth = closing ? Math.max(0, this.depth - 1) : this.depth + 1;
        this.buffer = this.buffer.slice(tag[0].length);
        continue;
      }
      const lower = this.buffer.toLowerCase();
      const pending =
        this.prefixes.some((prefix) => prefix.startsWith(lower)) ||
        (this.prefixes.some((prefix) => lower.startsWith(prefix)) &&
          !lower.includes('>') &&
          !lower.includes('&gt;'));
      if (pending) break;
      if (!this.depth) visible += this.buffer[0];
      this.buffer = this.buffer.slice(1);
    }
    return visible;
  }

  finish(): string {
    // Truncated markers and unclosed reasoning blocks fail closed.
    this.buffer = '';
    return '';
  }
}

export function stripReasoning(text: string): string {
  const filter = new ReasoningFilter();
  return filter.push(text) + filter.finish();
}

/** Only unwrap an explicitly labelled Markdown document, never ordinary code fences. */
export function prepareAssistantAnswer(text: string): string {
  const safe = stripReasoning(text).replace(/\r\n?/g, '\n');
  if (/^\s*```(?:markdown|md)\s*\n/i.test(safe)) {
    return safe.replace(/^\s*```(?:markdown|md)\s*\n/i, '').replace(/\n```\s*$/, '');
  }
  return safe;
}
