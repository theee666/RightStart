"""Synthetic rendering regression followed by two REAL service calls; fixtures never ship."""
import json,re,time,pathlib,os
from playwright.sync_api import sync_playwright, expect
base=os.environ.get('RIGHTSTART_BASE_URL','http://127.0.0.1:3000')
out=pathlib.Path('.work/repair');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 ctx=b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
 # Deliberately dirty TEST-ONLY events validate display/copy defenses independently of the proxy.
 fixture='<think>PRIVATE_RENDER_SECRET</think>\n```markdown\n## 正式答复\n\n- 核实条件\n\n|事项|来源|\n|---|---|\n|落户|[官方](https://www.sz.gov.cn/)|\n\n<script>window.__unsafe=true</script>\n```'
 def session_route(route):
  route.fulfill(json={'ok':True} if route.request.method=='POST' else {'configured':True,'requiresCode':False,'hasSession':True})
 ctx.route('**/api/session',session_route)
 frames=[{'event':'message','conversation_id':'b1000000-0000-4000-8000-000000000001','answer':fixture},{'event':'message_end'}]
 ctx.route('**/api/chat',lambda r:r.fulfill(content_type='text/event-stream',body=''.join('data: '+json.dumps(e,ensure_ascii=False)+'\n\n' for e in frames)))
 page=ctx.new_page();page.goto(base+'/assistant',wait_until='networkidle')
 page.get_by_label('聊天消息').fill('渲染回归测试（测试专用数据）');page.get_by_role('button',name='发送',exact=True).click()
 expect(page.locator('.markdown h2')).to_have_text('正式答复')
 expect(page.locator('.markdown table')).to_have_count(1)
 expect(page.locator('.markdown li')).to_have_count(1)
 expect(page.locator('.markdown a')).to_have_attribute('rel','noopener noreferrer')
 assert 'PRIVATE_RENDER_SECRET' not in page.locator('body').inner_text()
 assert not page.evaluate('window.__unsafe || false')
 page.get_by_role('button',name='复制回复',exact=True).click()
 copied=page.evaluate('navigator.clipboard.readText()')
 assert 'PRIVATE' not in copied and '<think>' not in copied and '```markdown' not in copied
 ctx.close();print('PASS test-only Markdown, list, table, link, HTML safety and clean clipboard.',flush=True)
 ctx=b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
 page=ctx.new_page();errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.post_data_json) if r.url.endswith('/api/chat') else None)
 page.goto(base+'/assistant',wait_until='networkidle')
 turns=[]
 for i,query in enumerate(['请简要介绍你支持哪些深圳应届毕业生政策咨询，以及是否支持 Offer 或劳动合同风险分析。请用 Markdown 表格列出服务范围。','继续刚才的话题，只补充一个查询深圳应届毕业生落户的官方核实入口，不做资格判断。']):
  page.get_by_label('聊天消息').fill(query)
  with page.expect_response('**/api/chat',timeout=300000) as info:page.get_by_role('button',name='发送',exact=True).click()
  response=info.value
  assert response.status==200,response.status
  print('REAL turn',i+1,'HTTP',response.status,'stream started',flush=True)
  expect(page.get_by_role('button',name='停止接收',exact=True)).to_have_count(0,timeout=290000)
  alerts=[s for s in page.locator('[role=alert]').all_text_contents() if s.strip()]
  assert not alerts,alerts
  wire=response.text()
  assert not re.search(r'<\/?think|reasoning_content|node_finished|node_started|workflow_started|agent_thought|"metadata"',wire,re.I)
  events=[json.loads(line[5:]) for line in wire.splitlines() if line.startswith('data:')]
  assert all(e['event'] in ['message','message_replace','message_end'] for e in events)
  assert any(e['event']=='message_end' for e in events)
  cid=next(e['conversation_id'] for e in events if e.get('conversation_id'))
  answer=page.locator('.chat-message.assistant .markdown').last.inner_text()
  assert answer.strip()
  turns.append({'httpStatus':response.status,'conversation':cid,'publicEvents':len(events),'answerCharacters':len(answer),'noReasoningOnWire':True})
  print('PASS real turn',i+1,'sanitized stream; answer characters',len(answer),flush=True)
 assert requests[0]['conversation_id']==''
 assert requests[1]['conversation_id']==turns[0]['conversation']==turns[1]['conversation']
 page.get_by_role('button',name='复制回复',exact=True).last.click()
 assert '<think>' not in page.evaluate('navigator.clipboard.readText()')
 page.screenshot(path=str(out/'assistant-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(out/'assistant-mobile.png'),full_page=True)
 page.get_by_role('button',name='新会话',exact=True).click();page.get_by_role('button',name='确认新建',exact=True).click()
 expect(page.locator('.chat-message')).to_have_count(0)
 page.reload(wait_until='networkidle');expect(page.locator('.chat-message')).to_have_count(0)
 assert not errors,errors
 for t in turns:t.pop('conversation')
 report={'fixtureRenderAndClipboard':'passed','realDifyTurns':turns,'conversationContinuity':'passed','mobileOverflow':False,'resetAndReload':'passed','browserErrors':errors}
 (out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print('PASS real server proxy, two-turn continuity, copy, mobile, reset and reload.',flush=True)
 b.close()
