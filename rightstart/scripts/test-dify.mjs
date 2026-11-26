// Reads the key from the server environment. Never prints credentials or user data.
import { writeFile, mkdir } from 'node:fs/promises';
const key = process.env.DIFY_API_KEY?.trim();
if (!key) {
  console.error('NOT TESTED: 请先手动填写 .env.local 的 DIFY_API_KEY，再运行 npm run test:dify。');
  process.exit(2);
}
const base = (process.env.DIFY_API_URL || 'https://api.dify.ai/v1').replace(/\/$/, '');
if (new URL(base).protocol !== 'https:') throw new Error('HTTPS required');
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const report = {
  date: new Date().toISOString(),
  appInfo: false,
  parameters: false,
  firstTurn: false,
  secondTurn: false,
  streamComplete: false,
};
async function get(path) {
  const r = await fetch(`${base}/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}
try {
  const info = await get('info');
  if (info.mode !== 'advanced-chat') throw new Error(`Unexpected application mode: ${info.mode}`);
  report.appInfo = true;
  console.log('PASS application type: advanced-chat');
  const parameters = await get('parameters');
  if (parameters.user_input_form?.length)
    throw new Error('Published input variables differ from supplied DSL; review before sending.');
  report.parameters = true;
  console.log(
    'PASS parameters: no custom input variables; uploads enabled:',
    !!parameters.file_upload?.enabled,
  );
  const user = `rightstart-integration-${crypto.randomUUID()}`;
  let conversation = '';
  async function turn(query) {
    const r = await fetch(`${base}/chat-messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: {},
        query,
        user,
        response_mode: 'streaming',
        conversation_id: conversation,
        auto_generate_name: false,
      }),
      signal: AbortSignal.timeout(270000),
    });
    if (!r.ok) throw new Error(`chat-messages: HTTP ${r.status}`);
    if (!r.body) throw new Error('Missing stream');
    let buffer = '',
      answer = '',
      ended = false;
    const previous = conversation;
    const decoder = new TextDecoder();
    for await (const chunk of r.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let m;
      while ((m = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, m.index);
        buffer = buffer.slice(m.index + m[0].length);
        const raw = frame
          .split(/\r?\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart())
          .join('\n');
        if (!raw || raw === '[DONE]') continue;
        const event = JSON.parse(raw);
        if (event.event === 'error') throw new Error('Dify stream error');
        if (event.conversation_id) conversation = event.conversation_id;
        if (['message', 'agent_message'].includes(event.event)) answer += event.answer || '';
        if (event.event === 'message_replace') answer = event.answer || '';
        if (event.event === 'message_end') ended = true;
      }
    }
    if (!ended || !answer.trim() || !conversation) throw new Error('Incomplete chat stream');
    if (previous && previous !== conversation) throw new Error('Conversation continuity failed');
    console.log(
      'PASS live stream and conversation continuity; response characters:',
      answer.length,
    );
    return true;
  }
  report.firstTurn = await turn(
    '我想了解深圳应届毕业生落户，应该先到哪个官方渠道核实？请给出有证据的入口，不需要判断我的资格。',
  );
  report.secondTurn = await turn(
    '继续刚才的深圳毕业生落户话题：首次办理前有哪些信息需要向官方确认？',
  );
  report.streamComplete = true;
  console.log(
    'PASS Dify live two-turn integration. Synthetic questions only; Dify may retain run logs.',
  );
} catch (e) {
  console.error('FAIL', e instanceof Error ? e.message : 'Integration failed');
  process.exitCode = 1;
}
await mkdir('.work', { recursive: true });
await writeFile('.work/dify-test-result.json', JSON.stringify(report, null, 2));
