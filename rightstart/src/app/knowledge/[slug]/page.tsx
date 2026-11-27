import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles } from '@/lib/knowledge';
import { SourceLinks } from '@/components/knowledge';
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: articles.find((a) => a.id === slug)?.title || '政策资料' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((a) => a.id === slug);
  if (!a) notFound();
  return (
    <article className="container page article">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>
        <Link href="/knowledge">职场知识</Link>
        <span>/</span>资料详情
      </div>
      <div className="page-heading">
        <div className="meta-row">
          <span className="tag">{a.category}</span>
          <span>{a.district}</span>
          <span>项目资料快照 · {a.snapshot}</span>
        </div>
        <h1 style={{ marginTop: 15 }}>{a.title}</h1>
        <p>以下保留项目知识库中的原始片段与出处，供阅读和核实，不直接构成资格或有效性判断。</p>
        <SourceLinks article={a} />
      </div>
      <div className={`notice ${a.lead ? 'warning' : ''}`}>
        {a.lead
          ? '这份资料包含历史批次或政策线索，不能直接据此判断当前可申请。'
          : '政策可能更新，正文中的生效时间、窗口及适用条件均须与官方最新发布核对。'}{' '}
        项目资料内的核验日期不等于本站已重新完成实时核验。
      </div>
      <div className="panel">
        <pre>{a.content}</pre>
      </div>
      <div className="panel">
        <h2 style={{ fontSize: 19, marginBottom: 12 }}>想结合自己的情况了解？</h2>
        <p className="status-inline">
          交给现有深圳政策 Chatflow 查询；不必提交证件号码或完整合同。
        </p>
        <div className="subtitle-links">
          <Link
            className="button primary"
            href={`/assistant?q=${encodeURIComponent(`请查询${a.district}的“${a.title}”，说明适用条件、当前窗口是否有证据，并提供官方出处。`)}`}
          >
            向 AI 进一步了解
          </Link>
          <Link className="button outline" href="/knowledge">
            返回知识中心
          </Link>
        </div>
      </div>
    </article>
  );
}
