import Link from '@/components/site-link';
export default function NotFound() {
  return (
    <div className="container page empty-state">
      <h1>这一页还没找到</h1>
      <p>可以回到工具箱，继续找到你需要的帮助。</p>
      <Link href="/tools" className="button primary">
        返回工具箱
      </Link>
    </div>
  );
}
