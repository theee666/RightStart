import Link from '@/components/site-link';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { ToolIcon } from './ui';
export function ToolShell({
  title,
  description,
  icon,
  children,
  badge,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>
        <Link href="/tools">职场工具</Link>
        <span>/</span>
        {title}
      </div>
      <div className="page-heading">
        <div className="title-with-icon">
          <ToolIcon name={icon} />
          <h1>{title}</h1>
        </div>
        <p>{description}</p>
        {badge && <span className="eyebrow">{badge}</span>}
      </div>
      <div className="tool-layout">
        <div>{children}</div>
        <aside className="tool-sidebar">
          <div className="sidebar-card">
            <ShieldCheck size={22} color="#78918b" />
            <h3 style={{ marginTop: 12 }}>先保护好你的信息</h3>
            <p>请勿输入完整证件号码、银行卡、住址或未脱敏合同。填写内容不保存为本站用户档案。</p>
            <Link href="/privacy" className="subtle-link">
              查看隐私与使用说明
            </Link>
          </div>
          <div className="sidebar-card">
            <Sparkles size={22} color="#6c86a2" />
            <h3 style={{ marginTop: 12 }}>想了解深圳的政策？</h3>
            <p>人才补贴、住房支持与毕业生落户，可以交给政策 AI 助手进一步梳理。</p>
            <Link href="/assistant" className="button secondary">
              咨询政策 AI 助手
            </Link>
          </div>
          <div className="sidebar-card">
            <h3>下一步，也准备好了</h3>
            <Link className="related-link" href="/tools/offer">
              <ToolIcon name="offer" small />
              核对 Offer
            </Link>
            <Link className="related-link" href="/tools/contract">
              <ToolIcon name="contract" small />
              检查劳动合同
            </Link>
            <Link className="related-link" href="/tools/checklist">
              <ToolIcon name="checklist" small />
              查看入职清单
            </Link>
            <Link className="related-link" href="/knowledge">
              <ToolIcon name="knowledge" small />
              查阅政策资料
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
