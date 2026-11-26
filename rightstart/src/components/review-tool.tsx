'use client';
import { useState, useRef } from 'react';
import { ClipboardCheck, RotateCcw, Printer } from 'lucide-react';
import { reviewPoints } from '@/lib/review';
import { CopyButton } from './ui';
type Report = { selected: number[]; fields: Record<string, string>; text: string };
export function ReviewTool({ kind }: { kind: 'offer' | 'contract' }) {
  const points = reviewPoints[kind];
  const [selected, setSelected] = useState<number[]>(points.map((_, i) => i));
  const [text, setText] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const labels =
    kind === 'offer'
      ? ['岗位名称', '工作城市', '薪资结构', '试用期期限及工资', '工作时间', '福利待遇']
      : ['合同名称及性质', '签约主体（可匿名）', '合同期限', '工作地点'];
  const reportText = report
    ? `RightStart ${kind === 'offer' ? 'Offer' : '合同'}核对清单（规则整理，非 AI 或法律意见）\n${Object.entries(
        report.fields,
      )
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}：${v}`)
        .join(
          '\n',
        )}\n${report.selected.map((i) => `${points[i].title}\n${points[i].why}\n请确认：${points[i].question}`).join('\n\n')}`
    : '';
  return (
    <>
      <div className="notice">
        根据你选择的方向整理待确认事项，便于和 HR 沟通。本工具不自动解读条款或判断风险；AI
        助手目前提供深圳政策咨询。
      </div>
      <form
        ref={form}
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (!selected.length) {
            setError('请至少选择一个核对项目。');
            return;
          }
          const fields = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<
            string,
            string
          >;
          setReport({ selected: [...selected], fields, text });
          setError('');
          setTimeout(
            () => result.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
            50,
          );
        }}
      >
        <div className="panel-heading">
          <h2>填写基本信息</h2>
          <span>仅用于本次整理</span>
        </div>
        <div className="form-grid">
          {labels.map((label, i) => (
            <label className="field" key={label}>
              {label}
              <input
                name={label}
                maxLength={250}
                placeholder={
                  kind === 'offer'
                    ? [
                        '例如：产品运营',
                        '例如：深圳市南山区',
                        '例如：固定月薪 + 绩效',
                        '例如：3 个月，工资按约定发放',
                        '例如：9:00–18:00，双休',
                        '例如：餐补、五险一金',
                      ][i]
                    : ['例如：劳动合同', '例如：A 公司', '例如：2026.12–2029.12', '例如：深圳市'][i]
                }
              />
            </label>
          ))}
        </div>
        <h3 className="section-label">选择核对方向</h3>
        <div className="check-chips">
          {points.map((p, i) => (
            <label className="check-chip" key={p.title}>
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={() =>
                  setSelected((s) => (s.includes(i) ? s.filter((v) => v !== i) : [...s, i]))
                }
              />
              {p.title}
            </label>
          ))}
        </div>
        <label className="field">
          {kind === 'offer' ? 'Offer 片段或补充说明' : '已脱敏的合同片段'}
          <textarea
            value={text}
            maxLength={10000}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="可选。请先移除姓名、证件号码、联系方式、详细地址等信息。本工具只整理核对方向，不自动解读文本。"
          />
          <small>{text.length} / 10000 · 片段仅显示在本次核对报告中，不发送至 AI。</small>
        </label>
        {error && (
          <div role="alert" className="notice error">
            {error}
          </div>
        )}
        <div className="form-actions" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="button primary" type="submit">
            <ClipboardCheck size={16} />
            生成核对清单
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              form.current?.reset();
              setText('');
              setSelected(points.map((_, i) => i));
              setReport(null);
              setError('');
            }}
          >
            <RotateCcw size={15} />
            清空
          </button>
        </div>
      </form>
      <div ref={result} className="panel result-panel" aria-live="polite">
        {!report ? (
          <div className="empty-state">
            <ClipboardCheck size={36} />
            <h2>把不确定，变成可确认的事项</h2>
            <p>填写信息并选择方向后，这里会生成你的核对清单。</p>
          </div>
        ) : (
          <>
            <div className="panel-heading">
              <h2>你的{kind === 'offer' ? ' Offer' : '合同'}核对清单</h2>
              <CopyButton text={reportText} />
            </div>
            <p className="report-intro">
              共 {report.selected.length}{' '}
              个核对方向。以下为待确认事项，不代表条款存在问题，也不判断合同效力。
            </p>
            {Object.values(report.fields).some(Boolean) && (
              <div className="quote">
                {Object.entries(report.fields)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      {k}：{v}
                    </div>
                  ))}
              </div>
            )}
            {report.selected.map((i) => (
              <div className="result-row" key={i}>
                <h3>
                  {points[i].title}
                  <span className="result-status">待向 HR 确认</span>
                </h3>
                <p>{points[i].why}</p>
                <div className="quote">可以这样问：{points[i].question}</div>
              </div>
            ))}
            {report.text && (
              <details>
                <summary>查看你提供的脱敏片段</summary>
                <div className="quote">{report.text}</div>
              </details>
            )}
            <div className="notice warning" style={{ marginTop: 20 }}>
              此清单为信息整理辅助，不构成正式法律意见。复杂条款或争议请向专业人士或当地主管部门咨询。
            </div>
            <button className="button outline" onClick={() => window.print()}>
              <Printer size={15} />
              打印 / 保存为 PDF
            </button>
          </>
        )}
      </div>
    </>
  );
}
