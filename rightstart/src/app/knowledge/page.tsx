import Link from '@/components/site-link';
import { KnowledgeCenter } from '@/components/knowledge';
export const metadata = { title: '职场知识中心' };
export default function Page() {
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>职场知识中心
      </div>
      <div className="page-heading">
        <span className="overline">KNOWLEDGE, WITH SOURCES</span>
        <h1>多一份了解，少一点不确定。</h1>
        <p>从已有的深圳政策资料开始，找到可以追溯的官方来源。</p>
      </div>
      <KnowledgeCenter />
    </div>
  );
}
