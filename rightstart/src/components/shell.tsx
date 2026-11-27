'use client';
import Link from '@/components/site-link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="RightStart 首页">
      <span className="brand-symbol">
        <i />
        <i />
        <i />
      </span>
      <span>
        RightStart<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-inner">
        <Brand />
        <nav className={open ? 'nav open' : 'nav'} aria-label="主导航">
          <Link className={path === '/' ? 'active' : ''} href="/" onClick={() => setOpen(false)}>
            首页
          </Link>
          <Link
            className={path.startsWith('/tools') ? 'active' : ''}
            href="/tools"
            onClick={() => setOpen(false)}
          >
            职场工具 <ChevronDown size={13} />
          </Link>
          <Link
            className={path.startsWith('/knowledge') ? 'active' : ''}
            href="/knowledge"
            onClick={() => setOpen(false)}
          >
            职场知识
          </Link>
          <Link
            className={path === '/about' ? 'active' : ''}
            href="/about"
            onClick={() => setOpen(false)}
          >
            关于 RightStart
          </Link>
        </nav>
        <Link className="button primary header-ai" href="/assistant">
          <Sparkles size={16} /> AI 职场助手
        </Link>
        <button
          className="icon-button menu-toggle"
          aria-label={open ? '关闭导航' : '展开导航'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <Brand />
          <p>职场第一步，走得更有底气。</p>
        </div>
        <div className="footer-links">
          <Link href="/tools">全部工具</Link>
          <Link href="/knowledge">知识中心</Link>
          <Link href="/privacy">隐私与使用说明</Link>
          <Link href="/about">关于项目</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} RightStart · 研究生小组项目</span>
        <span>信息整理与核对辅助 · 政策请以官方最新发布为准</span>
      </div>
    </footer>
  );
}
