"""Build the public reading library from supplied, public-policy text snapshots."""
import pathlib, re, json
root = pathlib.Path(__file__).resolve().parent.parent
districts = {'CITY':'深圳市','FT':'福田区','LUOHU':'罗湖区','YT':'盐田区','NS':'南山区','BA':'宝安区','LG':'龙岗区','LHQ':'龙华区','PS':'坪山区','GM':'光明区','DP':'大鹏新区','SS':'深汕合作区'}
categories = {'TALENT_SUBSIDY':'人才补贴','HUKOU':'毕业生落户','HOUSING':'住房支持'}
items=[]
for p in sorted((root/'DIFY_TXT').rglob('*.txt')):
    raw=p.read_text(encoding='utf-8-sig')
    chunks=raw.split('<<<RIGHTSTART_CHUNK>>>')
    first=chunks[0].strip()
    title=first.splitlines()[0].removeprefix('标题：').split('｜')[0].strip()
    urls=list(dict.fromkeys(re.findall(r'https://[^\s<>）)]+',raw)))
    official=[u for u in urls if re.match(r'https://(?:[^/]+\.)?(?:gov\.cn|sz\.gov\.cn)(?:/|$)',u)]
    # Never publish non-government leads as official evidence.
    if not official: continue
    code=p.parent.parent.name
    items.append({'id':p.stem.lower(),'title':title,'district':districts.get(code,code),'code':code,'category':categories[p.parent.name],'source':official[0],'sources':official,'content':raw.replace('<<<RIGHTSTART_CHUNK>>>','\n────────────────\n'),'snapshot':'2026-11-21','lead': 'LEAD' in p.stem or 'LEGACY' in p.stem,'excerpt': next((s.strip() for s in first.splitlines() if len(s)>65 and not s.startswith(('http','政府公报','政策来源'))),'查看项目收录的政策原文片段、适用边界与官方核实入口。')[:130]})
(root/'src/data').mkdir(parents=True,exist_ok=True)
(root/'src/data/knowledge.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'src/data/knowledge-index.json').write_text(json.dumps([{k:v for k,v in item.items() if k!='content'} for item in items],ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Imported {len(items)} documents with government sources.')
