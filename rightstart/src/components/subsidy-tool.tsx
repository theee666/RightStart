'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { districts } from '@/lib/catalog';
import { articleIndex as articles } from '@/lib/knowledge-index';
import { KnowledgeCard } from './knowledge';
import { Search, Sparkles } from 'lucide-react';
export function SubsidyTool() {
  const [city, setCity] = useState('深圳');
  const [district, setDistrict] = useState('深圳市');
  const [domain, setDomain] = useState('人才补贴');
  const [result, setResult] = useState<{
    city: string;
    district: string;
    domain: string;
    query: string;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const facts = [
            `学历：${fd.get('degree')}`,
            `毕业年月：${fd.get('graduation')}`,
            `就业状态：${fd.get('employment')}`,
            `合同签订状态：${fd.get('contract')}`,
            `社保缴纳状态：${fd.get('insurance')}`,
          ].join('；');
          setResult({
            city,
            district,
            domain,
            query: `我想了解${city === '深圳' ? `深圳${district === '深圳市' ? '市级' : district}` : city}的${domain}。我的自述情况：${facts}。这些事实仅对应我明确填写的维度，不要推断单位注册地或社保缴纳地。请按政策证据说明可能适用的项目、条件、缺失信息、窗口及官方来源，不把政策线索当成资格结论。`,
          });
          setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }}
      >
        <div className="panel-heading">
          <h2>先找到与你有关的政策方向</h2>
          <span>不收集证件信息</span>
        </div>
        <div className="form-grid">
          <label className="field">
            城市
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option>深圳</option>
              <option>其他城市</option>
            </select>
          </label>
          <label className="field">
            政策查询目标区
            <select
              disabled={city !== '深圳'}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            政策方向
            <select value={domain} onChange={(e) => setDomain(e.target.value)}>
              {['人才补贴', '住房支持', '毕业生落户'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            学历
            <select name="degree" required>
              <option value="">请选择</option>
              {['大专', '本科', '硕士', '博士', '其他或不确定'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            毕业年月
            <input required type="month" name="graduation" min="2000-01" max="2040-12" />
          </label>
          <label className="field">
            就业状态
            <select name="employment">
              {['在读', '未就业', '已获得 Offer', '已就业'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            是否签订劳动合同
            <select name="contract">
              {['尚未签订', '已签订', '不确定'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            社保缴纳状态
            <select name="insurance">
              {['尚未缴纳', '已缴纳，缴纳地和月份待补充', '不确定'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="notice" style={{ marginTop: 20 }}>
          当前知识库与 AI
          工作流覆盖深圳。目标区只是想查询的地区，不代表你的工作地、单位注册地或社保地；这些条件如有需要，AI
          会进一步确认。
        </div>
        <button type="submit" className="button primary">
          <Search size={16} />
          查看政策线索
        </button>
      </form>
      <div ref={ref} aria-live="polite" className="subsidy-results">
        {result ? (
          <>
            <div className="panel">
              <div className="panel-heading">
                <h2>
                  {result.city === '深圳'
                    ? `${result.district} · ${result.domain}`
                    : '该城市暂未收录'}
                </h2>
                <span>资料检索结果</span>
              </div>
              <div className="notice warning">
                {result.city === '深圳'
                  ? '以下只按目标区与政策方向筛选资料，未自动核验个人资格、金额或申请窗口。'
                  : '现有 Chatflow 只支持深圳，本站无法判断其他城市的资格或政策。请向该城市人社或政务服务渠道查询。'}
              </div>
              {result.city === '深圳' ? (
                <>
                  <p className="report-intro">
                    可以把你刚填写的信息交给现有工作流进一步查询。AI
                    会先查政策，再按需要补充事实，不保证可以申请。
                  </p>
                  <Link
                    className="button primary"
                    href={`/assistant?q=${encodeURIComponent(result.query)}`}
                  >
                    <Sparkles size={16} />让 AI 结合我的情况进一步查询
                  </Link>
                </>
              ) : (
                <a
                  className="button outline"
                  href="https://gjzwfw.www.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  前往国家政务服务平台
                </a>
              )}
            </div>
            {result.city === '深圳' && (
              <div className="knowledge-grid">
                {articles
                  .filter(
                    (a) =>
                      a.category === result.domain &&
                      (a.district === result.district || a.code === 'CITY'),
                  )
                  .slice(0, 8)
                  .map((a) => (
                    <KnowledgeCard key={a.id} article={a} />
                  ))}
              </div>
            )}
          </>
        ) : (
          <div className="panel empty-state">
            <Search size={34} />
            <h2>政策不靠猜，先从来源看起</h2>
            <p>填写基本信息后，查看相关资料和进一步查询入口。</p>
          </div>
        )}
      </div>
    </>
  );
}
