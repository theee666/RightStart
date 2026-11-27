"""Browser acceptance checks against the running local site. No AI fixtures."""
import json, os, pathlib, re
from playwright.sync_api import sync_playwright, expect

base=os.environ.get('RIGHTSTART_BASE_URL','http://127.0.0.1:3000')
output=pathlib.Path('.work/qa');output.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(name):
    checks.append(name)
    print('PASS',name,flush=True)

with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    paths=['/','/tools','/tools/offer','/tools/contract','/tools/insurance','/tools/checklist','/tools/interview','/tools/subsidy','/knowledge','/knowledge/city-hukou-svc-graduates','/assistant','/about','/privacy']
    for width in [1440,768,390,360]:
        page.set_viewport_size({'width':width,'height':1000 if width>600 else 844})
        for path in paths:
            response=page.goto(base+path,wait_until='networkidle')
            assert response.status==200,(path,response.status)
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),('overflow',width,path)
            assert not page.get_by_text('Build Error',exact=True).count(),('build error',path)
        passed(f'13 pages respond, render and fit viewport at {width}px')
    page.goto(base+'/');page.get_by_role('button',name='展开导航').click()
    expect(page.locator('.nav')).to_be_visible()
    page.locator('.nav').get_by_role('link',name='职场知识',exact=True).click()
    expect(page).to_have_url(base+'/knowledge')
    passed('mobile menu and navigation')
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(base+'/tools/offer')
    page.get_by_label('岗位名称',exact=True).fill('数据分析师')
    page.get_by_label('工作城市',exact=True).fill('深圳')
    page.get_by_role('button',name='生成核对清单',exact=True).click()
    expect(page.locator('.result-panel')).to_contain_text('数据分析师')
    expect(page.locator('.result-panel .result-row')).to_have_count(6)
    page.locator('.result-panel').get_by_role('button',name='复制',exact=True).click()
    assert '数据分析师' in page.evaluate('navigator.clipboard.readText()')
    page.evaluate('window.print=()=>{window.__printCalled=true}')
    page.get_by_role('button',name='打印 / 保存为 PDF').click()
    assert page.evaluate('window.__printCalled')
    page.get_by_role('button',name='清空',exact=True).click()
    expect(page.get_by_label('岗位名称',exact=True)).to_have_value('')
    passed('Offer fields, six-point report, clipboard, print and reset')
    page.goto(base+'/tools/contract')
    page.get_by_role('button',name='生成核对清单',exact=True).click()
    expect(page.locator('.result-panel .result-row')).to_have_count(9)
    passed('contract nine-point report')
    page.goto(base+'/tools/insurance')
    for label,value in [('税前月薪','12000'),('社保缴纳基数','10000'),('公积金缴存基数','12000')]:
        page.get_by_label(label,exact=True).fill(value)
    for name,personal,employer in [('养老保险','8','16'),('医疗保险','2','6'),('失业保险','0.2','0.8'),('工伤保险','0','0.2'),('生育保险','0','0')]:
        page.get_by_label(name+'个人比例',exact=True).fill(personal)
        page.get_by_label(name+'单位比例',exact=True).fill(employer)
    page.get_by_label('公积金个人比例（%）',exact=True).fill('5')
    page.get_by_label('公积金单位比例（%）',exact=True).fill('5')
    page.locator('form button[type=submit]').click()
    expect(page.locator('.calc-result-grid')).to_contain_text('1,620.00')
    expect(page.locator('.calc-result-grid')).to_contain_text('2,900.00')
    expect(page.locator('.calc-result-grid')).to_contain_text('1,200.00')
    passed('calculator personal 1620, employer 2900, fund account 1200 with synthetic parameters')
    page.goto(base+'/tools/checklist')
    checkbox=page.locator('.checklist-item input').first
    checkbox.check();page.reload(wait_until='networkidle')
    expect(checkbox).to_be_checked();expect(page.locator('.progress-stat')).to_contain_text('1')
    page.get_by_role('button',name='重置清单',exact=True).click()
    page.get_by_role('button',name='保留进度',exact=True).click();expect(checkbox).to_be_checked()
    page.get_by_role('button',name='重置清单',exact=True).click()
    page.get_by_role('button',name='确认重置',exact=True).click();expect(checkbox).not_to_be_checked()
    passed('checklist persistence, progress and confirmed reset')
    page.goto(base+'/tools/interview')
    page.get_by_label('岗位',exact=True).fill('数据分析师')
    page.get_by_role('button',name='整理我的提问清单',exact=True).click()
    page.get_by_role('button',name='职业发展',exact=True).click()
    expect(page.locator('.question-row').first).to_contain_text('数据分析师')
    page.locator('.question-row input').first.check();page.reload(wait_until='networkidle')
    page.get_by_role('button',name='职业发展',exact=True).click()
    expect(page.locator('.question-row input').first).to_be_checked()
    passed('interview personalization, categories and persistence')
    page.goto(base+'/knowledge')
    page.get_by_label('搜索知识库').fill('不存在的测试词')
    expect(page.get_by_text('没有找到匹配的资料',exact=True)).to_be_visible()
    page.get_by_role('button',name='清除筛选条件',exact=True).click()
    expect(page.locator('.knowledge-card')).to_have_count(12)
    page.get_by_role('button',name='再加载 12 份资料',exact=True).click()
    expect(page.locator('.knowledge-card')).to_have_count(24)
    page.get_by_role('button',name='毕业生落户',exact=True).click()
    assert all('毕业生落户' in text for text in page.locator('.knowledge-card').all_text_contents())
    passed('knowledge search, empty state, categories and pagination')
    page.goto(base+'/tools/subsidy')
    page.get_by_role('combobox',name='学历',exact=True).select_option('本科')
    page.get_by_label('毕业年月',exact=True).fill('2026-06')
    page.get_by_role('button',name='查看政策线索',exact=True).click()
    assert page.locator('.subsidy-results .knowledge-card').count()>0
    page.locator('.subsidy-results a.button.primary').click()
    expect(page.get_by_label('聊天消息')).to_have_value(re.compile('本科.*2026-06'))
    assert '?' not in page.url
    passed('subsidy source results and profile handoff to chat composer')
    page.goto(base+'/assistant')
    page.locator('.chat-suggestions button').first.click()
    expect(page.get_by_label('聊天消息')).not_to_have_value('')
    page.get_by_role('button',name='新建会话',exact=True).click()
    expect(page.get_by_label('聊天消息')).to_have_value('')
    passed('chat quick question and new conversation')
    # Session and validation checks. These requests deliberately fail before upstream calls.
    response=context.request.post(base+'/api/chat',data={'query':'x'},headers={'Origin':'https://invalid.example'})
    assert response.status==403
    other=browser.new_context()
    response=other.request.post(base+'/api/chat',data={'query':'x'},headers={'Origin':base})
    assert response.status==401
    session_response=context.request.post(base+'/api/session',data={},headers={'Origin':base})
    if session_response.status==200:
        response=context.request.post(base+'/api/chat',data={'query':'','inputs':{'invented':'x'}},headers={'Origin':base})
        assert response.status==400
        response=context.request.post(base+'/api/chat',data={'query':'x','conversation_id':'not-a-uuid'},headers={'Origin':base})
        assert response.status==400
        for _ in range(12):
            response=context.request.post(base+'/api/chat',data={'query':''},headers={'Origin':base})
        assert response.status==429
        passed('same-origin guard, anonymous authorization, strict variables, UUID validation and rate limit')
    else:
        assert session_response.status==401
        passed('configured classroom access code rejects unauthenticated calls')
    other.close()
    # Refresh screenshots after functional checks; leave the homepage in a clean state.
    for width,label in [(1440,'desktop'),(390,'mobile')]:
        page.set_viewport_size({'width':width,'height':1000 if width>600 else 844})
        for path,name in [('/','home'),('/assistant','assistant'),('/tools/offer','offer')]:
            page.goto(base+path,wait_until='networkidle')
            page.screenshot(path=str(output/f'{name}-{label}.png'),full_page=True)
    assert not errors,errors
    passed('no browser runtime errors')
    browser.close()

(output/'results.json').write_text(json.dumps({'checks':checks,'passed':len(checks)},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'COMPLETE {len(checks)} browser acceptance groups',flush=True)
