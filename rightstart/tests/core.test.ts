import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateContributions } from '../src/lib/calculator';
import { calculateInsurance } from '../src/lib/insurance';
import { SSEParser } from '../src/lib/sse';
import {
  ReasoningFilter,
  stripReasoning,
  prepareAssistantAnswer,
} from '../src/lib/assistant-answer';
import { PublicDifyEvents, publicDifyStream } from '../src/lib/public-dify-stream';
import { originAllowedFor } from '../src/lib/origin-policy';
import { assertApplicationResponse } from '../src/lib/api-response';

test('known EdgeOne origin survives an internal proxy host without accepting forged hosts', () => {
  const request = (origin: string, extra = {}) => new Request('http://internal:3000/api/session', {
    headers: { origin, host: 'internal:3000', 'x-forwarded-proto': 'http', ...extra },
  });
  assert.equal(originAllowedFor(request('https://rightstart.zh-cn.edgeone.cool')), true);
  assert.equal(originAllowedFor(request('https://rightst.asia')), true);
  assert.equal(originAllowedFor(request('https://rightst.asia.evil.example')), false);
  assert.equal(originAllowedFor(request('http://rightst.asia')), false);
  assert.equal(originAllowedFor(request('https://evil.example', { 'x-forwarded-host': 'evil.example' })), false);
  assert.equal(originAllowedFor(request('https://rightstart.zh-cn.edgeone.cool.evil.example')), false);
  assert.equal(originAllowedFor(request('https://another.edgeone.cool')), false);
  assert.equal(originAllowedFor(request('null')), false);
  assert.equal(originAllowedFor(request('https://rightstart.zh-cn.edgeone.cool', { 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(originAllowedFor(request('https://rightstart.example'), 'https://rightstart.example'), true);
  assert.equal(originAllowedFor(request('https://rightstart.example'), 'https://rightstart.example/unsafe'), false);
  assert.equal(originAllowedFor(new Request('https://rightstart.example/api/session', { headers: { origin: 'https://rightstart.example' } })), true);
  assert.equal(originAllowedFor(new Request('https://rightstart.example/api/session')), false);
});

test('platform preview HTML cannot be interpreted as an application JSON or SSE response', () => {
  const preview = new Response('<html>preview denied</html>', { status: 401, headers: { 'x-eop-msg': 'eo_time missing', 'Content-Type': 'text/html' } });
  assert.throws(() => assertApplicationResponse(preview), /预览/);
  assert.throws(() => assertApplicationResponse(new Response('<html>', { headers: { 'Content-Type': 'text/html' } })), /接口/);
  assert.doesNotThrow(() => assertApplicationResponse(Response.json({ error: 'auth' }, { status: 401 })));
  assert.doesNotThrow(() => assertApplicationResponse(new Response('data: {}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }), 'stream'));
  assert.throws(() => assertApplicationResponse(Response.json({}), 'stream'), /流式/);
});

test('reasoning markers are safe at every character boundary, including encoded and nested blocks', () => {
  for (const hidden of [
    '<think>PRIVATE_REASONING</think>',
    '<THINK>PRIVATE_REASONING</THINK>',
    '<think>PRIVATE_REASONING<analysis>INNER_SECRET</analysis></think>',
    '&lt;think&gt;PRIVATE_REASONING&lt;/think&gt;',
    '<|begin_of_thought|>PRIVATE_REASONING<|end_of_thought|>',
    '<!-- PRIVATE_REASONING -->',
  ]) {
    const input = `前文${hidden}## 正式答复\n\n请核实官方来源。`;
    for (let split = 0; split <= input.length; split++) {
      const f = new ReasoningFilter();
      const first = f.push(input.slice(0, split));
      assert.ok(!/PRIVATE|INNER|<think|&lt;think/.test(first), `leak at ${split}`);
      assert.equal(
        first + f.push(input.slice(split)) + f.finish(),
        '前文## 正式答复\n\n请核实官方来源。',
      );
    }
    const f = new ReasoningFilter();
    let visible = '';
    for (const character of input) {
      visible += f.push(character);
      assert.ok(!/PRIVATE|INNER|<think|&lt;think/.test(visible));
    }
  }
});

test('unclosed thoughts and partial delimiters fail closed on interruption', () => {
  assert.equal(stripReasoning('答复<think>PRIVATE_REASONING'), '答复');
  assert.equal(stripReasoning('答复<thi'), '答复');
  assert.equal(stripReasoning('答复<!-- PRIVATE_REASONING'), '答复');
  assert.equal(stripReasoning('</think>正常正文'), '正常正文');
});

test('Markdown document wrappers are removed while normal code, lists and URLs stay intact', () => {
  const markdown =
    '## 标题\n\n- 核实条件\n\n|事项|来源|\n|---|---|\n|落户|[官方](https://www.sz.gov.cn/)|';
  assert.equal(
    prepareAssistantAnswer(`<think>PRIVATE</think>\n\n\`\`\`markdown\n${markdown}\n\`\`\``),
    markdown,
  );
  const code = '```js\nconst value = "\\n";\n```';
  assert.equal(prepareAssistantAnswer(code), code);
});

test('public events exclude workflow internals, reasoning fields and end metadata', () => {
  const events: unknown[] = [];
  const f = new PublicDifyEvents((e) => events.push(e));
  f.accept({ event: 'node_finished', data: { status: 'succeeded' }, outputs: 'PRIVATE_NODE' });
  f.accept({ event: 'agent_thought', thought: 'PRIVATE_THOUGHT' });
  f.accept({
    event: 'message',
    conversation_id: 'real-conversation',
    answer: '<thi',
    reasoning_content: 'PRIVATE_FIELD',
  });
  f.accept({ event: 'message', answer: 'nk>PRIVATE_REASONING</think>## 正式答复' });
  f.accept({ event: 'message_end', metadata: { internal: 'PRIVATE_METADATA' } });
  f.finish();
  const wire = JSON.stringify(events);
  assert.ok(!/PRIVATE|reasoning_content|metadata|node_finished|agent_thought/.test(wire));
  assert.ok(wire.includes('real-conversation'));
  assert.ok(wire.includes('## 正式答复'));
});

test('replacement resets incomplete thought state; upstream errors contain no raw diagnostics', () => {
  const events: { event: string; answer?: string }[] = [];
  const f = new PublicDifyEvents((e) => events.push(e));
  f.accept({ event: 'message', answer: '<think>PRIVATE' });
  f.accept({ event: 'message_replace', answer: '<think>PRIVATE_NEW</think>新的答复' });
  f.accept({ event: 'error', message: 'PRIVATE_STACK' });
  assert.equal(events[1].answer, '新的答复');
  assert.ok(!JSON.stringify(events).includes('PRIVATE'));
});

test('server stream handles fragmented UTF-8 and SSE without transmitting private content', async () => {
  const raw = [
    { event: 'message', conversation_id: 'actual-id', answer: '<think>PRIVATE' },
    { event: 'message', answer: '</think>你好，深圳。' },
    { event: 'message_end', metadata: { internal: 'PRIVATE' } },
  ]
    .map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`)
    .join('');
  const bytes = new TextEncoder().encode(raw);
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      for (const byte of bytes) c.enqueue(Uint8Array.of(byte));
      c.close();
    },
  });
  const response = await new Response(publicDifyStream(source)).text();
  assert.ok(!/PRIVATE|<think>|metadata/.test(response));
  assert.ok(response.includes('你好，深圳。'));
  assert.ok(response.includes('actual-id'));
  assert.ok(response.includes('message_end'));
});
test('contributions round individual rows to cents, then total', () => {
  const r = calculateContributions([
    { name: 'A', base: 12345.67, personal: 2.5, employer: 6 },
    { name: 'B', base: 12345.67, personal: 0.2, employer: 0 },
  ]);
  assert.equal(r.details[0].personalAmount, 308.64);
  assert.equal(r.personal, 333.33);
  assert.equal(r.employer, 740.74);
  assert.equal(r.total, 1074.07);
});
test('zero rates are valid; negative, nonfinite and out-of-range values fail', () => {
  assert.equal(
    calculateContributions([{ name: 'zero', base: 0, personal: 0, employer: 0 }]).total,
    0,
  );
  for (const row of [
    { base: -1, personal: 2, employer: 3 },
    { base: 100, personal: 101, employer: 3 },
    { base: Infinity, personal: 2, employer: 3 },
    { base: 100, personal: NaN, employer: 3 },
  ])
    assert.throws(() => calculateContributions([{ name: 'invalid', ...row }]));
});
test('fund uses its own base and shows deduction before tax, not take-home pay', () => {
  const r = calculateInsurance({
    salary: 12000,
    socialBase: 10000,
    fundBase: 12000,
    rates: [{ name: 'test', personal: 10, employer: 20 }],
    fundPersonal: 5,
    fundEmployer: 5,
  });
  assert.equal(r.personal, 1600);
  assert.equal(r.employer, 2600);
  assert.equal(r.fundTotal, 1200);
  assert.equal(r.beforeTax, 10400);
});
test('SSE handles chunks split inside CRLF, comments, multi events and replacement', () => {
  const events: unknown[] = [];
  const p = new SSEParser((e) => events.push(e));
  p.feed(': ping\r\n\r\ndata: {"event":"mess');
  p.feed('age","answer":"你好"}\r');
  p.feed(
    '\n\r\ndata: {"event":"message_replace","answer":"更新"}\n\ndata: {"event":"message_end"}',
  );
  p.finish();
  assert.deepEqual(events, [
    { event: 'message', answer: '你好' },
    { event: 'message_replace', answer: '更新' },
    { event: 'message_end' },
  ]);
});
test('SSE propagates application errors and rejects invalid frames', () => {
  assert.throws(
    () =>
      new SSEParser(() => {
        throw Error('upstream failure');
      }).feed('data: {"event":"error"}\n\n'),
    /upstream failure/,
  );
  assert.throws(() => new SSEParser(() => {}).feed('data: malformed\n\n'));
});
