import Link from 'next/link';
import { MainCards } from '@/components/home';
import { ToolIcon } from '@/components/ui';
export const metadata = { title: '职场工具箱' };
export default function Page() {
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>职场工具箱
      </div>
      <div className="page-heading">
        <span className="overline">YOUR CAREER TOOLKIT</span>
        <h1>每一个阶段，都有趁手的工具。</h1>
        <p>从准备提问到顺利入职，找到现在需要的帮助。</p>
      </div>
      <MainCards />
      <div className="tool-directory">
        {[
          {
            href: '/tools/interview',
            title: '面试提问助手',
            icon: 'interview',
            text: '按维度整理问题，复制话术，记录已确认事项。',
          },
          {
            href: '/tools/subsidy',
            title: '深圳补贴与政策',
            icon: 'subsidy',
            text: '检索市级与各区资料，连接政策 AI 助手。',
          },
          {
            href: '/knowledge',
            title: '职场知识中心',
            icon: 'knowledge',
            text: '搜索项目提供的官方政策资料快照。',
          },
          {
            href: '/assistant',
            title: 'AI 政策助手',
            icon: 'ai',
            text: '咨询深圳人才补贴、住房支持和毕业生落户。',
          },
        ].map((t) => (
          <Link className="panel" href={t.href} key={t.href}>
            <ToolIcon name={t.icon} />
            <h2>{t.title}</h2>
            <p>{t.text}</p>
            <span className="subtle-link">打开工具</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
