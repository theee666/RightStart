import Link from 'next/link';
import { Chat } from '@/components/chat';
export const metadata = { title: 'AI 职场助手' };
export default function Page() {
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>AI 职场助手
      </div>
      <div className="page-heading">
        <span className="overline">A LITTLE CLARITY, A BETTER START</span>
        <h1>把问题说出来，把下一步找清楚。</h1>
        <p>
          由现有 RightStart Chatflow 提供深圳人才、住房与落户政策咨询。回复内容来自真实 AI
          服务，请核实官方出处。
        </p>
      </div>
      <Chat />
    </div>
  );
}
