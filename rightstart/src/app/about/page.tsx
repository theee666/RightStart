import Link from '@/components/site-link';
export const metadata = { title: '关于 RightStart' };
export default function Page() {
  return (
    <div className="container page prose-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span>/</span>关于 RightStart
      </div>
      <div className="page-heading">
        <span className="overline">A RIGHT START, YOUR WAY</span>
        <h1>职场第一步，走得更有底气。</h1>
        <p>
          RightStart
          是一个研究生小组项目，为应届毕业生与初入职场的年轻人整理入职事项，并提供有来源的深圳政策咨询。
        </p>
      </div>
      <div className="panel">
        <h2>从“我不太确定”开始</h2>
        <p>
          第一份 Offer
          怎么看？合同签字前要问什么？来深圳工作，有哪些住房和人才支持值得了解？我们希望把散落的问题，整理成可以一步步完成的行动。
        </p>
        <h2>工具与 AI，各自做好一件事</h2>
        <p>
          Offer
          与合同工具帮助你形成核对清单；五险一金工具用你填写的参数进行公式计算；面试提问与入职清单帮你记录确认进度。
        </p>
        <p>
          AI
          助手保留现有工作流，专注深圳人才、住房和毕业生落户政策。它可以查找证据、解释条件、按需询问补充信息。AI
          无法代替官方审核或专业判断。
        </p>
        <h2>看得见信息的来处</h2>
        <p>
          知识中心基于小组提供的公开政策资料，保留来源、地域、资料快照日期和适用边界。历史批次与政策线索并不意味着当前仍可申请。
        </p>
        <h2>围绕你的准备，不制造新的负担</h2>
        <p>
          无需注册即可使用基础工具。本站不建立个人档案；勾选清单只保存在本机。向 AI
          发送内容之前，请先移除个人敏感信息。
        </p>
        <div className="subtitle-links">
          <Link className="button primary" href="/tools">
            开始使用工具
          </Link>
          <Link className="button outline" href="/privacy">
            隐私与使用说明
          </Link>
        </div>
      </div>
    </div>
  );
}
