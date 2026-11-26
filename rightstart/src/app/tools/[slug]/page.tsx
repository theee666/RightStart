import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolIcon } from '@/components/ui';
import { ReviewTool } from '@/components/review-tool';
import { InsuranceTool } from '@/components/insurance-tool';
import { ChecklistTool, InterviewTool } from '@/components/checklist-tool';
import { SubsidyTool } from '@/components/subsidy-tool';
import { ShieldCheck, Sparkles } from 'lucide-react';
const pages: Record<
  string,
  { title: string; desc: string; icon: string; badge: string; color: string }
> = {
  offer: {
    title: 'Offer 核对清单',
    desc: '把薪资、试用期和福利逐项拆开，让重要的决定更清楚。',
    icon: 'offer',
    badge: '规则核对 · 不调用 AI',
    color: 'blue',
  },
  contract: {
    title: '劳动合同检查',
    desc: '签字前，把重要约定核对一遍。只需填写必要信息和脱敏片段。',
    icon: 'contract',
    badge: '规则核对 · 不构成法律意见',
    color: 'purple',
  },
  insurance: {
    title: '五险一金估算',
    desc: '自己填写实际缴费参数，算清个人扣款与单位缴存。',
    icon: 'insurance',
    badge: '本地计算 · 自定义参数',
    color: 'green',
  },
  checklist: {
    title: '入职准备清单',
    desc: '从入职前到转正，按自己的节奏，把每一步准备好。',
    icon: 'checklist',
    badge: '无需登录 · 本地保存',
    color: 'orange',
  },
  interview: {
    title: '面试提问助手',
    desc: '礼貌、具体地向 HR 提问，把重要信息问明白。',
    icon: 'interview',
    badge: '提问模板 · 已确认事项可勾选',
    color: 'blue',
  },
  subsidy: {
    title: '深圳补贴与政策',
    desc: '从人才、住房与落户三个方向，找到值得核实的政策线索。',
    icon: 'subsidy',
    badge: '现有知识库 · 真实 Chatflow 咨询',
    color: 'green',
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: pages[slug]?.title || '职场工具' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = pages[slug];
  if (!p) notFound();
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>
        <Link href="/tools">职场工具</Link>
        <span>/</span>
        {p.title}
      </div>
      <div className="page-heading">
        <div className="title-with-icon">
          <ToolIcon name={p.icon} color={p.color} />
          <h1>{p.title}</h1>
        </div>
        <p>{p.desc}</p>
        <span className="eyebrow">{p.badge}</span>
      </div>
      <div className="tool-layout">
        <div>
          {(slug === 'offer' || slug === 'contract') && (
            <>
              <ReviewTool kind={slug} />
            </>
          )}
          {slug === 'insurance' && <InsuranceTool />}
          {slug === 'checklist' && <ChecklistTool />}
          {slug === 'interview' && <InterviewTool />}
          {slug === 'subsidy' && <SubsidyTool />}
        </div>
        <aside className="tool-sidebar">
          <div className="sidebar-card">
            <ShieldCheck size={22} color="#78938b" style={{ marginBottom: 12 }} />
            <h3>放心使用，从脱敏开始</h3>
            <p>请勿输入完整身份证号、银行卡号、详细住址或完整合同。</p>
            <ul>
              <li>本站不建立个人信息档案</li>
              <li>普通工具在本机浏览器运行</li>
              <li>AI 提问由 Dify 及模型服务处理</li>
            </ul>
            <Link href="/privacy" className="subtle-link">
              了解隐私与使用说明
            </Link>
          </div>
          <div className="sidebar-card" style={{ background: '#f0f4f8' }}>
            <Sparkles size={22} color="#6c88a5" style={{ marginBottom: 12 }} />
            <h3>还有深圳政策问题？</h3>
            <p>人才补贴、住房支持、毕业生落户，可以交给政策 AI 助手继续查找。</p>
            <Link
              className="button primary"
              href={`/assistant?q=${encodeURIComponent(slug === 'subsidy' ? '我想了解深圳应届生的人才、住房和落户政策。' : '我是准备入职深圳的毕业生，想了解可以关注哪些人才与住房支持政策。')}`}
            >
              向 AI 助手提问
            </Link>
          </div>
          <div className="sidebar-card">
            <h3>你可能还需要</h3>
            {Object.entries(pages)
              .filter(([key]) => key !== slug)
              .slice(0, 4)
              .map(([key, value]) => (
                <Link className="related-link" href={`/tools/${key}`} key={key}>
                  <ToolIcon name={value.icon} color={value.color} small />
                  {value.title}
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
