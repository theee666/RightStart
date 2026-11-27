'use client';
import { useEffect, useState } from 'react';
import { checklist, questionGroups } from '@/lib/catalog';
import { CopyButton } from './ui';
import { RotateCcw } from 'lucide-react';
function useLocalChecks(key: string) {
  const [checked, setChecked] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(v)) setChecked(v.filter((x: unknown) => typeof x === 'string'));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, [key]);
  function update(next: string[]) {
    setChecked(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }
  return {
    checked,
    toggle: (id: string) =>
      update(checked.includes(id) ? checked.filter((v) => v !== id) : [...checked, id]),
    reset: () => update([]),
    ready,
    saved,
  };
}
export function ChecklistTool() {
  const { checked, toggle, reset, ready, saved } = useLocalChecks('rightstart-checklist-v1');
  const ids = checklist.flatMap((g, i) => g.items.map((_, j) => `${i}-${j}`));
  const count = checked.filter((id) => ids.includes(id)).length;
  const percent = Math.round((count / ids.length) * 100);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="panel">
        <div className="progress-stat">
          <div>
            <span>我的准备进度</span>
            <strong>{percent}%</strong>
          </div>
          <span>
            已完成 {count} / {ids.length} 项
          </span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="入职准备进度"
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <span className="status-inline">
            {ready ? '自动保存在本机浏览器' : '正在读取本地进度'}
          </span>
          <button className="text-button" onClick={() => setConfirm(true)}>
            <RotateCcw size={13} />
            重置清单
          </button>
        </div>
        {!saved && <p className="not-saved">浏览器存储不可用，刷新后进度会丢失。</p>}
        {confirm && (
          <div className="notice warning" role="alert" style={{ marginTop: 15, marginBottom: 0 }}>
            要清除这份清单的完成进度吗？
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                className="button danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                }}
              >
                确认重置
              </button>
              <button className="button outline" onClick={() => setConfirm(false)}>
                保留进度
              </button>
            </div>
          </div>
        )}
      </div>
      {checklist.map((g, i) => (
        <div className="panel" key={g.stage}>
          <div className="panel-heading">
            <div>
              <h2>{g.stage}</h2>
              <p className="stage-caption">{g.caption}</p>
            </div>
            <span>
              {g.items.filter((_, j) => checked.includes(`${i}-${j}`)).length}/{g.items.length}
            </span>
          </div>
          {g.items.map((item, j) => (
            <label
              className={`checklist-item ${checked.includes(`${i}-${j}`) ? 'done' : ''}`}
              key={item}
            >
              <input
                type="checkbox"
                checked={checked.includes(`${i}-${j}`)}
                disabled={!ready}
                onChange={() => toggle(`${i}-${j}`)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      ))}
      <div className="notice">
        这是一份通用准备清单，具体材料、办理时间和考核流程以公司的正式通知为准。
      </div>
    </>
  );
}
export function InterviewTool() {
  const { checked, toggle, ready, saved, reset } = useLocalChecks('rightstart-interview-v1');
  const [category, setCategory] = useState('全部');
  const [profile, setProfile] = useState({ industry: '', role: '', stage: 'Offer 沟通' });
  const [applied, setApplied] = useState(profile);
  const groups = questionGroups.map((group) =>
    group.title === '职业发展'
      ? {
          title: '职业发展',
          items: [
            `这个${applied.role || '岗位'}的前三个月目标与考核标准是什么？`,
            '团队如何安排新人培训、导师辅导和阶段反馈？',
            '岗位的成长方向与内部发展机会有哪些？',
          ],
        }
      : group,
  );
  const selectedGroups = category === '全部' ? groups : groups.filter((g) => g.title === category);
  const context = `我目前在${applied.stage}阶段${applied.industry ? `，关注${applied.industry}行业` : ''}${applied.role ? `的${applied.role}岗位` : ''}，想进一步确认以下事项：`;
  return (
    <>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ ...profile });
        }}
      >
        <div className="panel-heading">
          <h2>先说说你正在经历的阶段</h2>
          <span>规则整理 · 无需 AI</span>
        </div>
        <div className="form-grid">
          <label className="field">
            行业
            <input
              maxLength={40}
              value={profile.industry}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              placeholder="例如：互联网、制造业"
            />
          </label>
          <label className="field">
            岗位
            <input
              maxLength={50}
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              placeholder="例如：数据分析师"
            />
          </label>
          <label className="field">
            求职阶段
            <select
              value={profile.stage}
              onChange={(e) => setProfile({ ...profile, stage: e.target.value })}
            >
              {['初次沟通', '面试末尾', 'Offer 沟通', '签约前'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="button primary" style={{ marginTop: 18 }} type="submit">
          整理我的提问清单
        </button>
      </form>
      <div className="notice">{context} 下列问题来自通用提问模板，可复制、调整后使用。</div>
      <div className="filter-bar" aria-label="问题分类">
        {['全部', ...groups.map((g) => g.title)].map((v) => (
          <button
            className={`filter-button ${category === v ? 'active' : ''}`}
            key={v}
            onClick={() => setCategory(v)}
          >
            {v}
          </button>
        ))}
      </div>
      {selectedGroups.map((g) => (
        <div className="panel" key={g.title}>
          <div className="panel-heading">
            <h2>{g.title}</h2>
            <CopyButton label="复制此组" text={`${context}\n${g.items.join('\n')}`} />
          </div>
          {g.items.map((q, j) => (
            <div className="question-row" key={q}>
              <label
                className={`checklist-item ${checked.includes(`${g.title}-${j}`) ? 'done' : ''}`}
              >
                <input
                  type="checkbox"
                  disabled={!ready}
                  checked={checked.includes(`${g.title}-${j}`)}
                  onChange={() => toggle(`${g.title}-${j}`)}
                />
                <span>{q}</span>
              </label>
              <CopyButton text={q} />
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CopyButton
          label="复制全部问题"
          text={`${context}\n${groups.flatMap((g) => [g.title, ...g.items]).join('\n')}`}
        />
        <button className="text-button" onClick={reset}>
          清除已确认标记
        </button>
      </div>
      <p className="status-inline" style={{ marginTop: 12 }}>
        {saved ? '已确认标记仅保存在本机。' : '当前无法保存本地进度。'} 勾选表示已向 HR
        确认，不表示已满足任何政策条件。
      </p>
    </>
  );
}
