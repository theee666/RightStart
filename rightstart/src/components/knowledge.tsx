'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { articleIndex as articles, type ArticleSummary as Article } from '@/lib/knowledge-index';
import { districts } from '@/lib/catalog';
export function KnowledgeCard({ article: a }: { article: Article }) {
  return (
    <Link className="knowledge-card" href={`/knowledge/${a.id}`}>
      <div className="meta-row">
        <span className="tag">{a.category}</span>
        <span>{a.district}</span>
        {a.lead && <span>历史 / 线索资料</span>}
      </div>
      <h2>{a.title}</h2>
      <p>{a.excerpt}</p>
      <span className="subtle-link">
        阅读资料与来源 <BookOpen size={13} />
      </span>
    </Link>
  );
}
export function KnowledgeCenter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [district, setDistrict] = useState('全部地区');
  const [limit, setLimit] = useState(12);
  const filtered = articles.filter(
    (a) =>
      (category === '全部' || a.category === category) &&
      (district === '全部地区' || a.district === district) &&
      `${a.title} ${a.district} ${a.category} ${a.excerpt}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="notice">
        收录 {articles.length} 份项目提供的深圳政策资料，资料内核验标记为
        2026-11-21。这里是阅读快照，不代表当前正在受理；历史批次、线索与正式规则请分别核实。
      </div>
      <div className="form-grid">
        <div className="search-box">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(12);
            }}
            placeholder="搜索政策名称、区域或关键词"
            aria-label="搜索知识库"
          />
        </div>
        <label className="field">
          <select
            aria-label="按地区筛选"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setLimit(12);
            }}
          >
            <option>全部地区</option>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-bar">
        {['全部', '人才补贴', '住房支持', '毕业生落户'].map((c) => (
          <button
            className={`filter-button ${category === c ? 'active' : ''}`}
            key={c}
            onClick={() => {
              setCategory(c);
              setLimit(12);
            }}
          >
            {c}
          </button>
        ))}
        <span className="status-inline" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          找到 {filtered.length} 份资料
        </span>
      </div>
      <div className="knowledge-grid">
        {filtered.slice(0, limit).map((a) => (
          <KnowledgeCard key={a.id} article={a} />
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty-state">
          <Search size={30} />
          <h2>没有找到匹配的资料</h2>
          <p>试试“人才”“住房”或切换地区。</p>
          <button
            className="button secondary"
            style={{ marginTop: 15 }}
            onClick={() => {
              setSearch('');
              setCategory('全部');
              setDistrict('全部地区');
            }}
          >
            清除筛选条件
          </button>
        </div>
      )}
      {filtered.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 25 }}>
          <button className="button outline" onClick={() => setLimit((l) => l + 12)}>
            再加载 12 份资料
          </button>
        </div>
      )}
      <section className="section">
        <h2 style={{ fontSize: 22, marginBottom: 15 }}>常见问题</h2>
        {[
          {
            q: '为什么市级政策与区级政策要分别查看？',
            a: '不同文件可能针对不同对象、属地与申请批次。工作地、单位注册地和社保缴纳地也可能对应不同条件，不能直接互相替代。',
          },
          {
            q: '资料中的旧年份通知现在还能申请吗？',
            a: '不能仅凭文件年份判断。请查原文中的申请起止日期、适用批次与后续通知，历史材料只用于理解过去规则，不自动延伸到当前。',
          },
          {
            q: '想知道自己是否符合，该怎么做？',
            a: '可从政策查询页填写必要的基础信息后进入 AI 预审。缺少个人事实或政策证据时应保留“待确认”，最终结论以主管部门审核为准。',
          },
        ].map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
export function SourceLinks({ article }: { article: Article }) {
  return (
    <div className="subtitle-links">
      {article.sources.slice(0, 4).map((s, i) => (
        <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="button outline">
          {i === 0 ? '查看官方来源' : `官方补充来源 ${i}`}
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}
