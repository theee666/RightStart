'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AssistantMarkdown } from './assistant-markdown';
import { prepareAssistantAnswer } from '@/lib/assistant-answer';
import { Sparkles, Plus, Send, Square, LoaderCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { SSEParser } from '@/lib/sse';
import { prompts } from '@/lib/catalog';
import { ToolIcon, CopyButton } from './ui';
type Message = { id: string; role: 'user' | 'assistant'; content: string };
type Config = { configured: boolean; requiresCode: boolean; hasSession: boolean };
export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<Config | null>(null);
  const [code, setCode] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const conversation = useRef('');
  const controller = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  async function loadConfig() {
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法读取服务状态，请刷新重试。');
    }
  }
  useEffect(() => {
    void loadConfig();
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setInput(q.slice(0, 12000));
      window.history.replaceState(null, '', '/assistant');
    }
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);
  async function establishSession() {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '无法建立会话。');
    setConfig((c) => (c ? { ...c, requiresCode: false, hasSession: true } : c));
  }
  async function authorize(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setError('');
    try {
      await establishSession();
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '访问验证失败。');
    } finally {
      setAuthBusy(false);
    }
  }
  function reset() {
    controller.current?.abort();
    setMessages([]);
    setInput('');
    conversation.current = '';
    setError('');
    setConfirmReset(false);
    inputRef.current?.focus();
  }
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const query = input.trim();
    if (!query || busy) return;
    setError('');
    setBusy(true);
    const ctrl = new AbortController();
    controller.current = ctrl;
    const id = crypto.randomUUID();
    let ended = false;
    let responseText = '';
    let added = false;
    try {
      if (!config?.configured)
        throw new Error('AI 服务尚未配置，请由项目管理员填写服务端 DIFY_API_KEY 后重试。');
      if (config.requiresCode) throw new Error('请先输入课堂访问码。');
      if (!config.hasSession) await establishSession();
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'user', content: query },
        { id, role: 'assistant', content: '' },
      ]);
      added = true;
      setInput('');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversation_id: conversation.current }),
        signal: ctrl.signal,
      });
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {}
        if (response.status === 401) void loadConfig();
        throw new Error(data?.error || '请求失败，请稍后重试。');
      }
      if (!response.body) throw new Error('浏览器未能接收到回复数据。');
      const parser = new SSEParser((event) => {
        if (event.conversation_id) conversation.current = String(event.conversation_id);
        if (event.event === 'error')
          throw new Error(
            'AI 处理失败，请重试或新建会话；如持续出现，请管理员检查 Dify 运行记录。',
          );
        if (
          event.event === 'workflow_finished' &&
          event.data &&
          typeof event.data === 'object' &&
          'status' in event.data &&
          event.data.status === 'failed'
        )
          throw new Error('工作流执行失败，请联系管理员检查后端配置。');
        if (event.event === 'message' || event.event === 'agent_message') {
          responseText += String(event.answer || '');
          setMessages((m) => m.map((v) => (v.id === id ? { ...v, content: responseText } : v)));
        }
        if (event.event === 'message_replace') {
          responseText = String(event.answer || '');
          setMessages((m) => m.map((v) => (v.id === id ? { ...v, content: responseText } : v)));
        }
        if (event.event === 'message_end') ended = true;
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
        parser.feed(decoder.decode());
        parser.finish();
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!ended) throw new Error('回复连接提前中断，已有内容可能不完整。可以继续提问或重新发送。');
      if (!responseText.trim()) throw new Error('AI 未返回文字内容，请重新提问。');
    } catch (e) {
      if (ctrl.signal.aborted) {
        setError('已停止接收，当前回复可能不完整。');
      } else setError(e instanceof Error ? e.message : '网络连接失败，请稍后重试。');
      if (added && !responseText) setMessages((m) => m.filter((v) => v.id !== id));
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }
  const locked = busy || !config?.configured || config.requiresCode;
  return (
    <div className="chat-layout">
      <div className="chat-shell chat-layout-inner">
        <aside className="chat-sidebar">
          <button
            className="button outline"
            onClick={() => (messages.length ? setConfirmReset(true) : reset())}
            disabled={busy}
          >
            <Plus size={16} />
            新建会话
          </button>
          <h3>可以聊这些</h3>
          {['人才政策与补贴', '毕业生落户', '人才住房支持'].map((p, i) => (
            <button
              className="chat-topic"
              key={p}
              onClick={() => {
                setInput(prompts[i]);
                inputRef.current?.focus();
              }}
              disabled={busy}
            >
              {p}
            </button>
          ))}
          <h3 style={{ marginTop: 26 }}>继续使用工具</h3>
          {[
            ['/tools/offer', 'Offer 核对'],
            ['/tools/contract', '劳动合同检查'],
            ['/tools/insurance', '五险一金估算'],
            ['/tools/subsidy', '深圳政策查询'],
          ].map(([href, title]) => (
            <Link key={href} href={href}>
              {title}
            </Link>
          ))}
          <p>
            <ShieldCheck size={16} style={{ marginBottom: 6 }} />
            聊天内容只在当前页面保留。AI 请求会由 Dify 处理，请先脱敏。新建会话不删除 Dify
            侧运行记录。
          </p>
        </aside>
        <section className="chat-main">
          <div className="chat-top">
            <Sparkles size={17} />
            <strong>RightStart 职场助手</strong>
            <span>专注深圳毕业生政策</span>
            <button
              className="text-button chat-mobile-reset"
              disabled={busy}
              onClick={() => (messages.length ? setConfirmReset(true) : reset())}
            >
              <Plus size={15} />
              新会话
            </button>
          </div>
          {config && !config.configured && (
            <div className="notice warning chat-alert">
              AI 服务暂未就绪，基础工具可以继续使用。请联系项目维护者完成服务配置。
            </div>
          )}
          {config?.requiresCode && (
            <div className="notice chat-alert">
              <strong>输入课堂访问码以使用 AI</strong>
              <p>基础工具仍可直接使用。</p>
              <form className="auth-form" onSubmit={authorize}>
                <input
                  type="password"
                  autoComplete="off"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="课堂访问码"
                  maxLength={200}
                  required
                />
                <button className="button primary" disabled={authBusy} type="submit">
                  {authBusy ? '验证中' : '验证'}
                </button>
              </form>
            </div>
          )}
          {confirmReset && (
            <div className="notice warning chat-alert">
              新建会话将清空当前页面的聊天内容。
              <div className="subtitle-links">
                <button className="button secondary" onClick={reset}>
                  确认新建
                </button>
                <button className="button outline" onClick={() => setConfirmReset(false)}>
                  继续当前会话
                </button>
              </div>
            </div>
          )}
          <div className="chat-scroll" ref={scroll}>
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <ToolIcon name="ai" />
                <h2>你好，今天从哪里开始？</h2>
                <p>
                  人才补贴、住房支持、毕业生落户。
                  <br />
                  把困惑说出来，我们一起找到有出处的下一步。
                </p>
                <div className="chat-suggestions">
                  {prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setInput(p);
                        inputRef.current?.focus();
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <span className="status-inline">无需先填完整资料，按实际政策条件补充即可。</span>
              </div>
            ) : (
              messages.map((m) => (
                <div className={`chat-message ${m.role}`} key={m.id}>
                  {m.role === 'assistant' && (
                    <div className="chat-avatar">
                      <Sparkles size={17} />
                    </div>
                  )}
                  <div>
                    {m.role === 'assistant' ? (
                      m.content ? (
                        <>
                          <AssistantMarkdown content={m.content} />
                          {!busy && (
                            <CopyButton text={prepareAssistantAnswer(m.content)} label="复制回复" />
                          )}
                        </>
                      ) : (
                        <span className="status-inline">
                          <LoaderCircle
                            size={16}
                            className="spinner"
                            style={{
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              marginRight: 8,
                            }}
                          />
                          正在查找政策与核对证据…
                        </span>
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {error && (
            <div className="notice error chat-alert" role="alert">
              {error}
              <div className="subtitle-links">
                <button
                  className="text-button"
                  onClick={() => {
                    setInput(messages.filter((m) => m.role === 'user').at(-1)?.content || input);
                    setError('');
                    inputRef.current?.focus();
                  }}
                >
                  <RotateCcw size={13} />
                  返回编辑后重试
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    void loadConfig();
                    setError('');
                  }}
                >
                  刷新服务状态
                </button>
              </div>
            </div>
          )}
          <form className="chat-input" onSubmit={submit}>
            <div className="chat-input-box">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                maxLength={12000}
                placeholder="描述你的深圳政策问题；请勿输入证件号码等敏感信息"
                aria-label="聊天消息"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />
              <div className="chat-input-bottom">
                <span>{input.length}/12000 · Ctrl / ⌘ + Enter 发送</span>
                {busy ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => controller.current?.abort()}
                  >
                    <Square size={13} />
                    停止接收
                  </button>
                ) : (
                  <button
                    className="button primary"
                    disabled={locked || !input.trim()}
                    type="submit"
                  >
                    <Send size={15} />
                    发送
                  </button>
                )}
              </div>
            </div>
            <p>AI 回复可能不完整或过时，请核实官方来源；不构成法律意见。</p>
          </form>
        </section>
      </div>
    </div>
  );
}
