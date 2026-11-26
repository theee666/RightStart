'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Check,
  BriefcaseBusiness,
  FileText,
  Flag,
  BookOpen,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { tools, prompts } from '@/lib/catalog';
import { ToolIcon } from './ui';
export function AskBar() {
  const [value, setValue] = useState('');
  const router = useRouter();
  return (
    <form
      className="ask-bar"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) router.push(`/assistant?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <Sparkles size={21} />
      <input
        aria-label="向 AI 提问"
        maxLength={2000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="关于深圳人才补贴、住房、落户，你想了解什么？"
        required
      />
      <button className="button primary" type="submit">
        问问 AI <span className="desktop-only">助手</span>
      </button>
    </form>
  );
}
export function MainCards() {
  return (
    <div className="main-cards">
      {tools.map((t) => (
        <Link href={`/tools/${t.slug}`} className={`tool-card ${t.color}`} key={t.slug}>
          <div className="card-top">
            <ToolIcon name={t.icon} color={t.color} />
            <span className="card-tag">{t.tag}</span>
          </div>
          <h3>
            <span className="desktop-only">{t.title}</span>
            <span className="mobile-only">{t.short}</span>
          </h3>
          <p>{t.description}</p>
          <div className="card-points">
            {t.points.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
          <div className="card-bottom">
            开始使用 <ChevronRight size={16} />
          </div>
        </Link>
      ))}
    </div>
  );
}
export function Home() {
  return (
    <div className="container home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="mini-line" /> 为每一个职场新起点
          </span>
          <h1>
            第一份工作，
            <br />从<span>心里有底</span>开始。
          </h1>
          <p>
            从看懂 Offer 到安心入职，
            <br className="mobile-only" />
            把每一个关键选择，变成清晰的下一步。
          </p>
          <div className="hero-benefits">
            <span>
              <Check size={15} /> 轻松核对职场事项
            </span>
            <span>
              <Check size={15} /> 政策信息有据可查
            </span>
            <span>
              <Check size={15} /> 无需注册即可使用
            </span>
          </div>
          <Link className="button primary hero-button" href="#tools">
            找到我的职场工具
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <span className="art-caption">YOUR NEXT CHAPTER</span>
          <div className="journey-card j-one">
            <span className="journey-icon">
              <BriefcaseBusiness size={20} />
            </span>
            <div>
              <small>收到心动的 OFFER</small>
              <strong>看清每一份机会</strong>
            </div>
            <span className="journey-check">
              <Check size={15} />
            </span>
          </div>
          <div className="journey-card j-two">
            <span className="journey-icon">
              <FileText size={20} />
            </span>
            <div>
              <small>确认重要的约定</small>
              <strong>签下安心的名字</strong>
            </div>
            <span className="journey-check">
              <Check size={15} />
            </span>
          </div>
          <div className="journey-card j-three">
            <span className="journey-icon">
              <Flag size={20} />
            </span>
            <div>
              <small>准备好，出发</small>
              <strong>你好，职场新生活</strong>
            </div>
            <span className="art-star">✦</span>
          </div>
          <div className="path-line" />
          <span className="art-note">每一步，都算数。</span>
          <div className="art-stamp">
            R<span>START WITH CONFIDENCE</span>
          </div>
        </div>
      </section>
      <div className="home-assistant">
        <div className="ask-title">
          <Sparkles size={16} />
          <strong>有问题，先问问</strong>
          <span>深圳政策 AI 助手</span>
        </div>
        <AskBar />
        <div className="quick-prompts">
          <span>试试这样问</span>
          {prompts.slice(0, 2).map((p) => (
            <Link key={p} href={`/assistant?q=${encodeURIComponent(p)}`}>
              {p}
              <ChevronRight size={12} />
            </Link>
          ))}
        </div>
      </div>
      <section id="tools" className="section">
        <div className="section-heading">
          <div>
            <span className="overline">CAREER TOOLKIT</span>
            <h2>你的职场随身工具箱</h2>
            <p>不必一次了解所有事，从你正在经历的这一步开始。</p>
          </div>
          <Link href="/tools" className="subtle-link">
            查看全部工具 <ChevronRight size={16} />
          </Link>
        </div>
        <MainCards />
        <div className="secondary-tools">
          {[
            {
              slug: 'interview',
              icon: 'interview',
              title: '面试提问助手',
              desc: '把想问 HR 的问题，提前准备好。',
              color: 'blue',
            },
            {
              slug: 'subsidy',
              icon: 'subsidy',
              title: '深圳补贴与政策',
              desc: '人才、住房、落户，找到官方线索。',
              color: 'green',
            },
            {
              slug: 'knowledge',
              icon: 'knowledge',
              title: '职场知识中心',
              desc: '有来源的资料，帮你少一些不确定。',
              color: 'purple',
            },
          ].map((t) => (
            <Link key={t.slug} href={t.slug === 'knowledge' ? '/knowledge' : `/tools/${t.slug}`}>
              <ToolIcon name={t.icon} small color={t.color} />
              <div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="home-guides section">
        <div className="guides-main">
          <div className="section-heading">
            <div>
              <span className="overline">A LITTLE KNOWLEDGE, A BETTER START</span>
              <h2>把疑问，变成心里有数</h2>
            </div>
            <Link href="/knowledge" className="subtle-link">
              更多指南 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="guide-list">
            {[
              {
                title: '拿到 Offer 后，先确认这几件事',
                text: '固定工资、浮动绩效、工作地点与试用期',
                href: '/tools/offer',
                tag: 'Offer 核对',
              },
              {
                title: '合同签字前，有哪些内容需要问清？',
                text: '核对主体、期限、附件，保存自己的签署版本',
                href: '/tools/contract',
                tag: '签约准备',
              },
              {
                title: '深圳毕业生落户，从哪里开始了解？',
                text: '查阅项目收录的官方办事指引，核实适用条件',
                href: '/knowledge/city-hukou-svc-graduates',
                tag: '深圳政策',
              },
            ].map((g) => (
              <Link href={g.href} key={g.href}>
                <span className="guide-tag">{g.tag}</span>
                <div>
                  <h3>{g.title}</h3>
                  <p>{g.text}</p>
                </div>
                <ChevronRight size={18} />
              </Link>
            ))}
          </div>
        </div>
        <aside className="shenzhen-card">
          <MapPin size={23} />
          <span className="overline">FOCUS ON SHENZHEN</span>
          <h3>
            来深圳，
            <br />
            也带上一份准备。
          </h3>
          <p>汇集市级与各区人才、住房和落户资料。先找到方向，再核实条件。</p>
          <Link href="/tools/subsidy" className="button white">
            查找深圳政策
          </Link>
          <div className="city-lines" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </aside>
      </section>
      <section className="faq-section section">
        <div className="section-heading">
          <div>
            <h2>开始之前，你可能想知道</h2>
          </div>
          <BookOpen size={23} />
        </div>
        {[
          {
            q: 'RightStart 的 AI 助手可以帮我做什么？',
            a: '现有 AI 工作流支持深圳应届毕业生人才补贴、住房支持与落户政策查询，并根据政策按需追问、辅助资格预审。Offer 与合同页面提供确定性核对工具，不使用 AI 判断合同效力。',
          },
          {
            q: '我输入的合同和个人信息会被保存吗？',
            a: '本站不建立用户档案，不保存合同输入。AI 提问会发送到 Dify 及其配置的模型服务，可能按服务方设置保留日志。请只发送脱敏后的必要信息。清单与面试问题勾选仅保存在本机浏览器中。',
          },
          {
            q: '政策查询结果可以作为申请依据吗？',
            a: '不能。知识中心展示项目提供的资料快照，AI 回复也可能不完整或过时。政策窗口、资格、金额与材料要求须以主管部门最新官方文件及实际受理口径为准。',
          },
        ].map((f) => (
          <details key={f.q}>
            <summary>
              {f.q}
              <ChevronRight size={17} />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
      <div className="trust-strip">
        <ShieldCheck size={27} />
        <div>
          <strong>你的每一步，都值得被认真对待。</strong>
          <p>
            请对输入内容脱敏。本站提供信息整理与核对辅助，不构成法律意见；具体政策请以官方渠道为准。
          </p>
        </div>
        <Link href="/privacy">
          了解使用说明 <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
