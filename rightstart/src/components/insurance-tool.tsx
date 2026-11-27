'use client';
import { useState } from 'react';
import { Calculator, ExternalLink } from 'lucide-react';
import { calculateInsurance, type InsuranceInput } from '@/lib/insurance';
const money = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function InsuranceTool() {
  const [result, setResult] = useState<ReturnType<typeof calculateInsurance> | null>(null);
  const [error, setError] = useState('');
  const [city, setCity] = useState('深圳');
  return (
    <>
      <div className="notice warning">
        自定义参数估算：本工具未预置城市费率、缴费上下限或个税规则。请从公司或当地官方渠道取得实际参数后填写。城市选择不会自动套用政策。
      </div>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const val = (k: string) => Number(f.get(k));
          try {
            const input: InsuranceInput = {
              salary: val('salary'),
              socialBase: val('socialBase'),
              fundBase: val('fundBase'),
              rates: ['养老保险', '医疗保险', '失业保险', '工伤保险', '生育保险'].map(
                (name, i) => ({ name, personal: val(`p${i}`), employer: val(`e${i}`) }),
              ),
              fundPersonal: val('fundPersonal'),
              fundEmployer: val('fundEmployer'),
            };
            setResult(calculateInsurance(input));
            setError('');
          } catch (err) {
            setError(err instanceof Error ? err.message : '请检查参数。');
          }
        }}
      >
        <div className="panel-heading">
          <h2>基本信息与缴费基数</h2>
          <span>金额单位：元 / 月</span>
        </div>
        <div className="form-grid">
          <label className="field">
            工作城市
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setResult(null);
              }}
            >
              {['深圳', '广州', '北京', '上海', '杭州', '其他城市'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            税前月薪
            <input
              required
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              name="salary"
              placeholder="例如：12000"
            />
          </label>
          <label className="field">
            社保缴纳基数
            <input
              required
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              name="socialBase"
              placeholder="按实际申报基数填写"
            />
          </label>
          <label className="field">
            公积金缴存基数
            <input
              required
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              name="fundBase"
              placeholder="按实际申报基数填写"
            />
          </label>
        </div>
        <h3 className="section-label">社保缴费比例（%）</h3>
        <p className="status-inline" style={{ marginTop: 6 }}>
          按实际适用口径填写；确定无需缴纳的项目请填 0。同一基数无法适用时，请分项计算。
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>缴费项目</th>
                <th>个人比例 %</th>
                <th>单位比例 %</th>
              </tr>
            </thead>
            <tbody>
              {['养老保险', '医疗保险', '失业保险', '工伤保险', '生育保险'].map((n, i) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td>
                    <label className="field">
                      <input
                        required
                        aria-label={`${n}个人比例`}
                        name={`p${i}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.001"
                        placeholder="填写比例"
                      />
                    </label>
                  </td>
                  <td>
                    <label className="field">
                      <input
                        required
                        aria-label={`${n}单位比例`}
                        name={`e${i}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.001"
                        placeholder="填写比例"
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-grid">
          <label className="field">
            公积金个人比例（%）
            <input
              required
              name="fundPersonal"
              type="number"
              min="0"
              max="100"
              step="0.001"
              placeholder="按实际比例填写"
            />
          </label>
          <label className="field">
            公积金单位比例（%）
            <input
              required
              name="fundEmployer"
              type="number"
              min="0"
              max="100"
              step="0.001"
              placeholder="按实际比例填写"
            />
          </label>
        </div>
        {error && (
          <div className="notice error" role="alert" style={{ marginTop: 20 }}>
            {error}
          </div>
        )}
        <button className="button primary" style={{ marginTop: 22 }} type="submit">
          <Calculator size={16} />
          计算缴存估算
        </button>
      </form>
      <div className="panel" aria-live="polite">
        {result ? (
          <>
            <div className="panel-heading">
              <h2>{city} · 本次参数估算</h2>
              <span>逐项四舍五入到分</span>
            </div>
            <div className="calc-result-grid">
              <div className="stat-box">
                <span>个人月扣款</span>
                <strong>¥{money(result.personal)}</strong>
                <small>社保 + 公积金</small>
              </div>
              <div className="stat-box">
                <span>单位月缴存</span>
                <strong>¥{money(result.employer)}</strong>
                <small>不从个人工资中扣除</small>
              </div>
              <div className="stat-box">
                <span>公积金月入账</span>
                <strong>¥{money(result.fundTotal)}</strong>
                <small>个人与单位合计</small>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>基数</th>
                    <th>个人缴存</th>
                    <th>单位缴存</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{money(r.base)}</td>
                      <td>{money(r.personalAmount)}</td>
                      <td>{money(r.employerAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="notice">
              扣除上述个人缴费后的金额（尚未扣个税及其他项目）：¥{money(result.beforeTax)}
              。这不是实际到手工资。若结果为负，请核实工资与基数。附加费用、各险种不同基数与地方取整方式未纳入。
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Calculator size={35} />
            <h2>让缴费明细更清楚</h2>
            <p>填写实际参数，查看个人扣款与单位缴存的构成。</p>
          </div>
        )}
      </div>
      <div className="panel">
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>官方核实渠道</h2>
        <p className="status-inline">
          {city === '深圳'
            ? '深圳可通过以下官方渠道核对政策、缴费记录与公积金账户。'
            : '其他城市请进入当地人社、医保和住房公积金主管部门官网核实。本页深圳入口不适用于其他城市。'}
        </p>
        <div className="subtitle-links">
          {(city === '深圳'
            ? [
                ['深圳市人社局', 'https://hrss.sz.gov.cn/'],
                ['深圳市医疗保障局', 'https://hsa.sz.gov.cn/'],
                ['深圳市住建局（公积金）', 'https://zjj.sz.gov.cn/'],
              ]
            : [['国家政务服务平台', 'https://gjzwfw.www.gov.cn/']]
          ).map(([name, url]) => (
            <a
              key={url}
              href={url}
              className="button outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {name}
              <ExternalLink size={13} />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
