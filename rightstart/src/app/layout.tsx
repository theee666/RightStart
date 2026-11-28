import type { Metadata } from 'next';
import { Header, Footer } from '@/components/shell';
import { earlyChunkRecovery } from '@/lib/early-chunk-recovery';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'RightStart｜职场第一步，走得更有底气', template: '%s · RightStart' },
  description:
    '为应届毕业生与职场新人准备的 Offer 核对、合同检查、五险一金估算、入职清单与深圳政策 AI 助手。',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script id="rightstart-resource-recovery" dangerouslySetInnerHTML={{ __html: earlyChunkRecovery }} />
      </head>
      <body>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
