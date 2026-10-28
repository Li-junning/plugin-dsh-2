/* Compiled by scripts/build.mjs; all artwork is embedded in the shipped client. */
window.__ModuleLoader__.load({id:'dsh-bayern-home',factory:(require)=>{
  'use strict';
  const React = require('react'), h = React.createElement;
  const CSS = __THEME_CSS__, CREST = __CREST_URI__;
  __DATA_CODE__
  __LINEUP_CODE__
  __STUDIO_CODE__
  const STORAGE = 'dsh-bayern-home:settings:v1';
  const defaults = normalizePreferences();
  let prefs = {...defaults};
  try { const p = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    for (const key of ['spoiler','quiet','matchday','mini','railPinned','railHintSeen']) if (typeof p[key] === 'boolean') prefs[key] = p[key];
    if (Number.isFinite(p.strength)) prefs.strength = Math.max(20,Math.min(100,p.strength));
    if (['Asia/Shanghai','Europe/Berlin'].includes(p.zone)) prefs.zone = p.zone;
    if ([15,30,60,120].includes(p.lead)) prefs.lead = p.lead;
    Object.assign(prefs,normalizeLayout(p));
  } catch {}
  function cachedSeason(season) {
    try {return readFixtureCache(localStorage.getItem(CACHE_PREFIX+season),season);} catch {return null;}
  }
  let studio=normalizeStudio(null);
  try {studio=normalizeStudio(JSON.parse(localStorage.getItem(STUDIO_STORAGE) || 'null'));} catch {}
  let initialStudioSaveFailed=false;
  const beforeProfiles=JSON.stringify(studio);
  studio={...studio,board:fillOfficialBench(fillPlayerProfiles(studio.board,OFFICIAL_LINEUP),OFFICIAL_SQUAD,{onlyIfMissing:true}),savedBoards:studio.savedBoards.map(row=>({...row,board:fillPlayerProfiles(row.board,OFFICIAL_LINEUP)}))};
  if(JSON.stringify(studio)!==beforeProfiles) {try {localStorage.setItem(STUDIO_STORAGE,JSON.stringify({version:1,...studio}));} catch {initialStudioSaveFailed=true;}}
  let initialWork={note:'',snapshots:[],commands:[],commandDraft:null},initialWorkError=false;try{initialWork=readWorkState(localStorage.getItem(WORK_STORAGE));}catch{initialWorkError=true;}
  const initialSeason = seasonFor(), initialCache = cachedSeason(initialSeason);
  let state = {...studio,prefs,workNote:initialWork.note,workSnapshots:initialWork.snapshots,workCommands:initialWork.commands,workCommandDraft:initialWork.commandDraft,workCommandSelection:'clarify',workSaveStatus:initialWorkError?'error':'saved',workReadError:initialWorkError,open:false,tab:'home',tacticView:{...DEFAULT_TACTIC_VIEW},matchView:{mode:'upcoming',query:'',venue:'all',competition:'all'},formation:studio.board.formation,matches:initialCache?.matches || [],coverage:initialCache?.coverage || [],loading:false,requested:!!initialCache,updatedAt:initialCache?.updatedAt || null,fromCache:!!initialCache,error:'',toast:'',saveStatus:initialStudioSaveFailed?'error':'saved',saveErrors:{prefs:false,studio:initialStudioSaveFailed},hostPresent:false,activeChat:false,season:initialSeason,revealed:[],currentMatches:initialCache?.matches || [],currentUpdatedAt:initialCache?.updatedAt || null,currentFromCache:!!initialCache,currentCoverage:initialCache?.coverage || [],currentError:''};
  const listeners = new Set();
  let controller = null, toastTimer = null, currentInput = null, disposed = false;
  function publish(patch) { if (disposed) return; state = {...state,...patch}; listeners.forEach(fn=>fn(state)); syncTheme(); }
  function useState() { const [value,set] = React.useState(state); React.useEffect(()=>{listeners.add(set);set(state);return ()=>listeners.delete(set);},[]); return value; }
  function syncTheme() {
    const root = document.documentElement;
    root.toggleAttribute('data-bh-panel',state.open && state.hostPresent);
    root.toggleAttribute('data-bh-quiet',state.prefs.quiet);
    root.toggleAttribute('data-bh-active',state.activeChat);
    root.toggleAttribute('data-bh-matchday',state.prefs.matchday || isMatchday(state.currentMatches));
    root.style.setProperty('--bh-strength',String(state.prefs.strength / 100));
    root.style.setProperty('--bh-panel-width',state.prefs.panelWidth+'px');
    root.setAttribute('data-bh-mini-position',state.prefs.miniPosition);
    const host=document.querySelector('[data-bh-host]'),layer=document.getElementById('bh-layer');
    if(host && layer) {const a=host.getBoundingClientRect(),b=layer.getBoundingClientRect();root.style.setProperty('--bh-mini-left',Math.max(16,a.left-b.left+24)+'px');root.style.setProperty('--bh-content-top',Math.max(0,a.top-b.top)+'px');}
  }
  function notify(message) { clearTimeout(toastTimer);publish({toast:message});toastTimer = setTimeout(()=>publish({toast:''}),4200); }
  function recordSave(scope,ok) {
    const saveErrors={...state.saveErrors,[scope]:!ok},failed=saveErrors.prefs||saveErrors.studio;
    publish({saveErrors,saveStatus:failed?'error':'saved',...(!failed&&state.saveStatus==='error'?{toast:''}:{})});
  }
  function preferences(patch) {
    const next={...state.prefs,...patch};Object.assign(next,normalizeLayout(next));
    publish({prefs:next,...('spoiler' in patch?{revealed:[]}:{} )});
    try {localStorage.setItem(STORAGE,JSON.stringify(next));recordSave('prefs',true);return true;} catch {recordSave('prefs',false);notify('偏好尚未保存，可重试或导出主场备份。');return false;}
  }
  function preference(key,value) {return preferences({[key]:value});}
  function saveStudio() {
    try {localStorage.setItem(STUDIO_STORAGE,JSON.stringify({version:1,...normalizeStudio(state)}));recordSave('studio',true);return true;}
    catch {recordSave('studio',false);notify('本机保存失败，可重试或导出主场备份。');return false;}
  }
  function patchStudio(patch,persist=true) {publish({...patch,...(!persist?{saveStatus:state.saveErrors.prefs||state.saveErrors.studio?'error':'editing'}:{})});return persist?saveStudio():true;}
  function saveWorkState(patch){const work=normalizeWorkState({note:state.workNote,snapshots:state.workSnapshots,commands:state.workCommands,commandDraft:state.workCommandDraft,...patch});publish({workNote:work.note,workSnapshots:work.snapshots,workCommands:work.commands,workCommandDraft:work.commandDraft,workReadError:false});try{localStorage.setItem(WORK_STORAGE,JSON.stringify({version:1,...work}));publish({workSaveStatus:'saved'});return true;}catch{publish({workSaveStatus:'error'});return false;}}
  function saveWorkNote(value){return saveWorkState({note:value});}
  function patchTacticView(patch){publish({tacticView:{...state.tacticView,...patch}});}
  function retryLocalSave(){const errors={...state.saveErrors};let saved=true;if(errors.prefs)saved=preferences({...state.prefs})&&saved;if(errors.studio)saved=saveStudio()&&saved;if(saved)notify('主场数据已保存在本机。');}
  async function refresh(force = false) {
    if (state.loading || disposed) return;
    if (!force && !state.fromCache && state.updatedAt && Date.now() - state.updatedAt < 60000) return;
    controller = new AbortController(); const request = controller, season = state.season;
    const timeout = setTimeout(()=>request.abort(),12000);
    publish({loading:true,requested:true});
    try {
      const {matches,coverage} = await fetchSeason(season,request.signal,{matches:state.matches,coverage:state.coverage}), updatedAt = Date.now();
      const missing=coverage.filter(c=>c.status==='error'),error=missing.map(c=>competitionLabel(c.competition)+'读取失败'+(c.updatedAt?'，已保留缓存':'')).join('；');
      if (controller !== request || disposed) return;
      publish({matches,coverage,updatedAt,fromCache:false,error,...(season===seasonFor()?{currentMatches:matches,currentCoverage:coverage,currentError:error,currentUpdatedAt:updatedAt,currentFromCache:false}:{})});
      try {
        localStorage.setItem(CACHE_PREFIX+season,writeFixtureCache(matches,season,updatedAt,coverage));
        for (let y=2000;y<seasonFor()-2;y++) localStorage.removeItem(CACHE_PREFIX+y);
      } catch {} // Storage may be unavailable or full; keep the in-memory result usable.
    } catch(error) {
      if(controller === request && !disposed) {const message=error.name === 'AbortError' ? '赛程读取超时，请稍后重试。' : '暂时无法连接 OpenLigaDB；请检查网络后重试。';const coverage=COMPETITIONS.map(c=>({competition:c.id,status:'error',updatedAt:state.coverage.find(v=>v.competition===c.id)?.updatedAt || null}));publish({error:message,coverage,...(season===seasonFor()?{currentError:message,currentCoverage:coverage,currentFromCache:!!state.currentUpdatedAt}:{})});}
    } finally {
      clearTimeout(timeout);
      if(controller === request) {controller = null;publish({loading:false});}
    }
  }
  function chooseSeason(season) {
    controller?.abort();controller=null;
    const cache=cachedSeason(season);
    publish({season,matches:cache?.matches || [],coverage:cache?.coverage || [],updatedAt:cache?.updatedAt || null,fromCache:!!cache,requested:!!cache,loading:false,error:'',revealed:[]});
    refresh(true);
  }
  function open(tab = 'home', currentSeason = false) {
    publish({open:true,tab});
    if(currentSeason && state.season!==seasonFor())chooseSeason(seasonFor());else refresh();
  }
  function close() {
    publish({open:false,revealed:[],tacticView:{...DEFAULT_TACTIC_VIEW},matchView:{mode:'upcoming',query:'',venue:'all',competition:'all'}});
    if(state.season!==seasonFor()) {
      controller?.abort();controller=null;const cache=cachedSeason(seasonFor());
      publish({season:seasonFor(),matches:cache?.matches || [],coverage:cache?.coverage || [],updatedAt:cache?.updatedAt || null,fromCache:!!cache,requested:!!cache,loading:false,error:''});
    }

  }
  function revealScore(id) {publish({revealed:state.revealed.includes(id)?state.revealed.filter(value=>value!==id):[...state.revealed,id]});}
  function updatedLabel(timestamp,zone) {
    return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(timestamp));
  }
  function downloadCalendar(m) {
    try {const content = makeCalendar(m,state.prefs.lead);const url = URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));const a = document.createElement('a');a.href=url;a.download=`拜仁比赛-${m.id}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('日历已导出；导入日历应用后可在赛前提醒。');} catch(error) {notify(error.message);}
  }
  function Icon({name,size=18}) {
    const shapes={
      more:[['circle',{cx:5,cy:12,r:1}],['circle',{cx:12,cy:12,r:1}],['circle',{cx:19,cy:12,r:1}]],
      search:[['circle',{cx:10,cy:10,r:6}],['path',{d:'m15 15 6 6'}]],
      refresh:[['path',{d:'M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3'}]],
      calendar:[['rect',{x:3,y:5,width:18,height:16,rx:3}],['path',{d:'M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2m-8 3h2'}]],
      tactics:[['rect',{x:3,y:3,width:18,height:18,rx:3}],['path',{d:'M3 12h18M12 3v18'}],['circle',{cx:12,cy:12,r:3}]],
      focus:[['path',{d:'M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M8 9h8m-8 4h8m-8 4h5'}]],
      sun:[['circle',{cx:12,cy:12,r:4}],['path',{d:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5'}]],
      moon:[['path',{d:'M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z'}]],
      chevron:[['path',{d:'m9 5 7 7-7 7'}]],
      close:[['path',{d:'m6 6 12 12M6 18 18 6'}]],
      pin:[['path',{d:'m9 3 6 0-1 6 4 4v2H6v-2l4-4-1-6ZM12 15v6'}]],
      home:[['path',{d:'m3 10 9-7 9 7v10H3ZM9 20v-7h6v7'}]],
      move:[['path',{d:'M12 3v18M3 12h18m-12-6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3'}]],
      route:[['path',{d:'M5 19C5 7 18 18 18 5m-4 2 4-3 3 4'}],['circle',{cx:5,cy:19,r:2}]],
      undo:[['path',{d:'M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14'}]],
      card:[['rect',{x:3,y:5,width:18,height:14,rx:3}],['circle',{cx:8,cy:11,r:2}],['path',{d:'M5 16c1-3 5-3 6 0m3-6h4m-4 4h4'}]],
      save:[['path',{d:'M4 3h13l4 4v14H3V3Zm3 0v7h10V3M7 21v-7h10v7'}]],
      download:[['path',{d:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'}]],
      sort:[['path',{d:'M4 6h16M4 12h12M4 18h8'}]],
      layout:[['rect',{x:3,y:3,width:18,height:18,rx:3}],['path',{d:'M8 3v18M8 9h13'}]],
      eye:[['path',{d:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z'}],['circle',{cx:12,cy:12,r:3}]]
    };
    return h('svg',{className:'bh-glyph',width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,focusable:false},(shapes[name]||shapes.chevron).map(([tag,attrs],i)=>h(tag,{...attrs,key:i})));
  }
  function toggle(label,detail,key,s) { return h('div',{className:'bh-row',key},h('div',null,h('strong',null,label),h('p',null,detail)),h('button',{className:'bh-switch',type:'button',role:'switch','aria-label':label,'aria-checked':s.prefs[key],onClick:()=>preference(key,!s.prefs[key])})); }
  const link = (url,text) => h('a',{href:url,target:'_blank',rel:'noopener noreferrer'},text+' ↗');
  function sources(s) { return h('div',{className:'bh-status'},
    h('span',{className:'bh-source-label'},s.updatedAt ? `${s.fromCache || s.error ? '本机缓存' : '更新于'} ${updatedLabel(s.updatedAt,s.prefs.zone)} · ${s.season}/${s.season+1} · 德甲 / 欧冠 / 德国杯` : '尚未读取赛程'),
    h('br'),s.error && s.updatedAt ? '部分赛程可能未更新，请核对下方各赛事状态。' : s.fromCache ? '正在尝试更新；缓存最长保留 30 天。' : 'OpenLigaDB 社区数据 · 比分可能延迟',
    h('div',{className:'bh-coverage','aria-label':'赛事同步状态'},COMPETITIONS.map(c=>{const status=s.coverage.find(v=>v.competition===c.id),count=s.matches.filter(m=>m.competition===c.id).length;return h('div',{key:c.id},c.label+' · '+(!status?'待同步':status.status==='error'?'读取失败'+(status.updatedAt?' · 缓存 '+updatedLabel(status.updatedAt,s.prefs.zone):''):status.status==='empty'?'数据源暂无收录比赛':count+' 场'));})),
    h('div',{className:'bh-links'},link('https://www.openligadb.de','数据来源'),link('https://fcbayern.com/en/matches/profis','官方全赛事赛程'))); }
  async function retryFixtures(event){const target=event.currentTarget,tab=state.tab,focused=document.activeElement===target;await refresh(true);if(focused&&state.open&&state.tab===tab&&!state.loading&&!state.error&&(document.activeElement===document.body||document.activeElement===target))document.querySelector('.bh-panel .bh-body h2')?.focus({preventScroll:true});}
  function failure(s) {return s.error?h('div',{role:'status',className:'bh-alert bh-error bh-retry-note'},h('p',null,s.loading?'正在重新读取赛程…':s.error),h('button',{className:'bh-button','aria-label':'重试读取赛程','aria-disabled':s.loading,onClick:retryFixtures},s.loading?'重试中…':'重试')):null;}
  const PRIMARY_PAGES=[['home','主场','home'],['matches','比赛','calendar'],['more','更多','more']];
  const TOOL_PAGES=[{id:'tactics',label:'战术',title:'战术板',copy:'编辑球员卡牌、排阵与替补换人',icon:'tactics'},{id:'fan',label:'名片',title:'球迷名片',copy:'制作并导出自己的球迷名片',icon:'card'},{id:'work',label:'工作',title:'工作助手',copy:'暂存便签、常用指令与进度交接',icon:'card'},{id:'settings',label:'设置',title:'主场设置',copy:'外观、布局、比赛偏好与备份',icon:'layout'}];
  function More() {
    return h(React.Fragment,null,h('h2',{tabIndex:-1},'更多'),h('p',{className:'bh-copy'},'需要的时候，再打开你的主场工具。'),
      [['工作工具',TOOL_PAGES.filter(v=>v.id==='work')],['创作工具',TOOL_PAGES.filter(v=>['tactics','fan'].includes(v.id))],['主场偏好',TOOL_PAGES.filter(v=>v.id==='settings')]].map(([title,items])=>h('section',{className:'bh-more-group',key:title,'aria-label':title},h('h3',null,title),items.map(item=>h('button',{id:'bh-tool-'+item.id,key:item.id,className:'bh-more-item','aria-label':'打开'+item.title,onClick:()=>publish({tab:item.id})},h('span',{className:'bh-more-symbol'},h(Icon,{name:item.icon,size:20})),h('span',{className:'bh-more-copy'},h('strong',null,item.title),h('small',null,item.copy)),h(Icon,{name:'chevron',size:16}))))));
  }
  function MatchDiscussion({match,zone}) {
    const [angle,setAngle]=React.useState('attack'),field=React.useRef(null),text=matchDiscussionPrompt(match,angle,zone);
    const selectText=()=>{field.current?.focus();field.current?.select();};
    const draft=()=>{
      if(typeof currentInput?.actions?.setDraft==='function'){
        try{currentInput.actions.setDraft(currentInput.draft?currentInput.draft+'\n\n'+text:text);notify('话题已放入对话草稿，确认后再发送。');close();}catch{selectText();notify('暂时无法写入草稿，请复制下方话题。');}
      }else{selectText();notify('先打开一个 DSH 对话，或复制已选中的话题。');}
    };
    const copy=async()=>{try{await navigator.clipboard.writeText(text);notify('赛前话题已复制。');}catch{selectText();notify('自动复制不可用，话题已选中，请手动复制。');}};
    return h('details',{className:'bh-match-discussion'},h('summary',null,'赛前聊点什么'),h('p',{className:'bh-copy'},'选个观赛角度，准备一段话题。只放入草稿，确认后再发送。'),
      h('label',{className:'bh-discussion-angle'},h('span',null,'观赛角度'),h('select',{className:'bh-select','aria-label':'观赛角度',value:angle,onChange:e=>setAngle(e.target.value)},MATCH_DISCUSSION_ANGLES.map(([id,label])=>h('option',{key:id,value:id},label)))),
      h('textarea',{ref:field,className:'bh-discussion-text','aria-label':'赛前讨论话题',readOnly:true,value:text,rows:7}),
      h('div',{className:'bh-discussion-actions'},h('button',{className:'bh-button bh-primary',onClick:draft},'放入对话草稿'),h('button',{className:'bh-button',onClick:copy},'复制话题')));
  }
  function Home({s,now}) {
    const next = nextMatch(s.matches,now), opponent = next && (next.homeId === TEAM_ID ? next.away : next.home),historical=s.season!==seasonFor();
    return h(React.Fragment,null,h('h2',{tabIndex:-1},'主场概览'),h('p',{className:'bh-copy'},historical?'你正在浏览 '+s.season+'/'+String(s.season+1).slice(2)+' 赛季。':'下一场比赛和常用工具。'),
      historical?h('div',{className:'bh-season-note',role:'note'},h('span',null,'历史赛季 · '+s.season+'/'+String(s.season+1).slice(2)),h('button',{className:'bh-button',onClick:()=>chooseSeason(seasonFor())},'回到当前赛季')):null,
      h('article',{className:'bh-stage'},h('div',{className:'bh-stage-top'},h('span',null,h('i',{className:'bh-dot'}),historical?'该赛季下一场比赛':'下一场比赛'),h('span',{className:'bh-tag'},next ? competitionLabel(next.competition)+' · '+(next.homeId === TEAM_ID ? '主场' : '客场') : s.loading?'同步中':s.error?'未连接':'待同步')),
        h('div',{className:'bh-team-pair'},h('img',{src:CREST,alt:'拜仁队徽'}),h('div',null,h('strong',null,next ? `拜仁 vs ${shortTeam(opponent)}` : s.loading?'正在读取赛程':s.error?'赛程暂时不可用':'暂无已确认的比赛'),h('small',null,next ? dateLabel(next.kickoff,s.prefs.zone) : s.loading ? '正在连接 OpenLigaDB…' : s.error?'重试后查看下一场比赛':'等待数据源提供赛程'))),
        h('div',{className:'bh-count'},next ? countdown(next.kickoff,now) : ''),h('small',{className:'bh-caption'},next ? '距离开球 · '+(s.prefs.zone==='Asia/Shanghai'?'北京时间':'慕尼黑时间') : ''),
        next ? h('button',{className:'bh-button bh-primary bh-wide',onClick:()=>downloadCalendar(next)},'＋ 加入我的比赛日历') : null),
      failure(s),!s.loading && s.requested && !s.error && !next ? h('div',{className:'bh-alert'},'该赛季暂未提供下一场已确认时间的德甲、欧冠或德国杯比赛。可打开官方全赛事赛程查看。') : null,
      h(MatchDiscussion,{match:next,zone:s.prefs.zone}),
      h('button',{className:'bh-home-tools',onClick:()=>publish({tab:'more'})},h(Icon,{name:'more',size:18}),h('span',null,'工具与设置'),h(Icon,{name:'chevron',size:15})),
      h('button',{className:'bh-button bh-wide',onClick:()=>publish({tab:'matches'})},'查看赛程与比分 →'),sources(s));
  }
  function Matches({s,now}) {
    const {mode,query,venue,competition}=s.matchView;
    const setView=patch=>publish({matchView:{...state.matchView,...patch}}),setMode=mode=>setView({mode}),setQuery=query=>setView({query}),setVenue=venue=>setView({venue});
    const future=s.matches.filter(m=>!m.finished),results=s.matches.filter(m=>m.finished).reverse();
    const list=mode==='upcoming'?future:results,term=query.trim().toLocaleLowerCase();
    const filtered=list.filter(m=>(competition==='all'||m.competition===competition)&&(venue==='all'||(venue==='home'?m.homeId===TEAM_ID:m.awayId===TEAM_ID))&&(!term||[m.home,m.away,shortTeam(m.home),shortTeam(m.away),m.round,competitionLabel(m.competition)].join(' ').toLocaleLowerCase().includes(term)));
    const groups=fixtureGroups(filtered,s.prefs.zone),hasFilter=!!term||venue!=='all'||competition!=='all';
    const reset=()=>setView({query:'',venue:'all',competition:'all'});
    return h(React.Fragment,null,h('h2',{tabIndex:-1},'赛程与比分'),h('p',{className:'bh-copy'},'德甲 / 欧冠 / 德国杯 · '+s.season+'/'+String(s.season+1).slice(2)+' · '+(s.prefs.zone==='Asia/Shanghai'?'北京时间':'慕尼黑时间')),
      h('div',{className:'bh-topline'},h('div',{className:'bh-segment'},h('button',{className:'bh-button','aria-pressed':mode==='upcoming',onClick:()=>setMode('upcoming')},'待赛',h('span',{className:'bh-count-badge','aria-hidden':true},future.length)),h('button',{className:'bh-button','aria-pressed':mode==='results',onClick:()=>setMode('results')},'赛果',h('span',{className:'bh-count-badge','aria-hidden':true},results.length))),h('button',{className:'bh-button',disabled:s.loading,onClick:()=>refresh(true),'aria-label':'刷新赛程'},h(Icon,{name:'refresh',size:14}),s.loading?'读取中…':'刷新')),
      h('div',{className:'bh-fixture-filters'},h('label',{className:'bh-search'},h(Icon,{name:'search',size:16}),h('input',{type:'search',className:'bh-search-input','aria-label':'搜索对手或轮次',placeholder:'搜索对手或轮次',value:query,maxLength:80,onChange:e=>setQuery(e.target.value)})),h('div',{className:'bh-filter-row bh-competition-filters'},h('label',null,h('span',{className:'bh-field-label'},'赛事'),h('select',{className:'bh-select','aria-label':'赛事筛选',value:competition,onChange:e=>setView({competition:e.target.value})},h('option',{value:'all'},'全部赛事'),COMPETITIONS.map(c=>h('option',{key:c.id,value:c.id},c.label)))),h('label',null,h('span',{className:'bh-field-label'},'主客场'),h('select',{className:'bh-select','aria-label':'主客场筛选',value:venue,onChange:e=>setVenue(e.target.value)},h('option',{value:'all'},'全部场地'),h('option',{value:'home'},'拜仁主场'),h('option',{value:'away'},'拜仁客场'))),h('label',null,h('span',{className:'bh-field-label'},'赛季'),h('select',{className:'bh-select','aria-label':'赛季',value:s.season,onChange:e=>chooseSeason(Number(e.target.value))},[seasonFor(),seasonFor()-1,seasonFor()-2].map(y=>h('option',{key:y,value:y},y+'/'+String(y+1).slice(2)))))),h('div',{className:'bh-filter-summary',role:'status','aria-live':'polite'},h('span',null,hasFilter?'找到 '+filtered.length+' 场比赛':'共 '+list.length+' 场'+(mode==='upcoming'?'待赛':'赛果')),hasFilter?h('button',{className:'bh-text-action',onClick:reset},'重置筛选'):null)),
      toggle('封存赛果','单场可以单独揭晓，其他比分继续封存。','spoiler',s),failure(s),
      s.fromCache && s.updatedAt?h('div',{className:'bh-cache-note',role:'status'},'本机缓存 · '+updatedLabel(s.updatedAt,s.prefs.zone)+(s.loading?' · 更新中':' · 请以最新赛程为准')):null,
      s.loading&&!s.matches.length?h('div',{className:'bh-empty-state',role:'status'},h(Icon,{name:'calendar',size:26}),h('strong',null,'正在读取赛程'),h('p',null,'稍后即可查看比赛与日历提醒。')):!groups.length?h('div',{className:'bh-empty-state'},h(Icon,{name:'search',size:26}),h('strong',null,hasFilter?'没有找到匹配的比赛':'暂时没有'+(mode==='upcoming'?'待赛':'赛果')),h('p',null,hasFilter?'试试其他对手名称，或恢复全部场地。':'刷新或切换赛季，查看数据源提供的赛程。'),hasFilter?h('button',{className:'bh-button',onClick:reset},'清除搜索与筛选'):null):null,
      groups.map(({label,matches})=>h('section',{className:'bh-month',key:label,'aria-label':label},h('h3',{className:'bh-month-label'},label,h('span',null,matches.length+' 场')),
        matches.map(m=>{
          const available=canRevealScore(m,now),sealed=available&&s.prefs.spoiler&&!s.revealed.includes(m.id),home=m.homeId===TEAM_ID;
          return h('article',{className:'bh-fixture',key:m.id},h('div',{className:'bh-fixture-meta'},h('small',null,dateLabel(m.kickoff,s.prefs.zone)),h('span',{className:'bh-match-state','data-state':m.finished?'finished':available?'unconfirmed':'upcoming'},matchState(m,now))),
            h('div',{className:'bh-fixture-teams'},h('span',{'data-bayern':home||undefined},shortTeam(m.home)),sealed?h('button',{className:'bh-score sealed','aria-label':'揭晓 '+shortTeam(m.home)+' 对 '+shortTeam(m.away)+' 的比分',onClick:()=>revealScore(m.id)},h(Icon,{name:'eye',size:14}),'揭晓比分'):h('b',{className:'bh-score'},scoreText(m,false,now)),h('span',{'data-bayern':!home||undefined},shortTeam(m.away))),
            h('div',{className:'bh-fixture-foot'},h('small',null,competitionLabel(m.competition)+' · '+(home?'主场':'客场')+' · '+m.round),!available&&m.kickoff?h('button',{onClick:()=>downloadCalendar(m)},'＋ 日历提醒'):available&&s.prefs.spoiler&&!sealed?h('button',{onClick:()=>revealScore(m.id),'aria-label':'重新封存 '+shortTeam(m.home)+' 对 '+shortTeam(m.away)+' 的比分'},'重新封存'):link(m.source,'原始数据')));
        }))),sources(s));
  }

  __STUDIO_UI__
  function Settings({s}) {
    const jump=id=>{const el=document.getElementById('bh-settings-'+id);el?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});el?.focus({preventScroll:true});};
    return h(React.Fragment,null,h('h2',{tabIndex:-1},'主场设置'),h('p',{className:'bh-copy'},'主题跟随系统，偏好与编辑自动保存在本机。'),
      h('nav',{className:'bh-settings-jumps','aria-label':'设置分组'},[['look','外观','sun'],['match','比赛偏好','calendar'],['backup','备份与恢复','save']].map(([id,label,icon])=>h('button',{key:id,onClick:()=>jump(id)},h(Icon,{name:icon,size:14}),label))),
      h('section',{className:'bh-settings-group','aria-labelledby':'bh-settings-look'},h('h3',{id:'bh-settings-look',tabIndex:-1},'外观与布局'),
        h('div',{className:'bh-row'},h('div',null,h('strong',null,'自动跟随 Windows'),h('p',null,'随系统切换浅色或深色。')),h('span',{className:'bh-theme-value'},h('span',{className:'bh-theme-light'},'日场'),h('span',{className:'bh-theme-dark'},'夜场'))),
        h('div',{className:'bh-row bh-strength-label'},h('div',null,h('strong',null,'背景浓度'),h('p',null,'对话开始后自动降低亮度。')),h('output',{htmlFor:'bh-background-strength'},s.prefs.strength+'%')),
        h('input',{id:'bh-background-strength',className:'bh-range',type:'range',min:20,max:100,value:s.prefs.strength,'aria-label':'背景浓度',onChange:e=>preference('strength',Number(e.target.value))}),
        toggle('迷你比赛卡','显示下一场比赛；聊天时自动收起。','mini',s),toggle('固定快捷工具','保持右侧工具展开；Esc 可取消固定。','railPinned',s),toggle('专注阅读','收起球场背景和迷你比赛卡。','quiet',s)),
      h('details',{className:'bh-settings-layout'},h('summary',null,'布局与位置'),h(LayoutEditor,{s,embedded:true})),
      h('section',{className:'bh-settings-group','aria-labelledby':'bh-settings-match'},h('h3',{id:'bh-settings-match',tabIndex:-1},'比赛偏好'),toggle('点亮主场','红色比赛日氛围；真实比赛日自动点亮。','matchday',s),toggle('封存赛果','默认隐藏比分，单场可独立揭晓。','spoiler',s),
        h('div',{className:'bh-row'},h('div',null,h('strong',null,'显示时区'),h('p',null,'德国夏令时自动换算。')),h('select',{className:'bh-select','aria-label':'显示时区',value:s.prefs.zone,onChange:e=>preference('zone',e.target.value)},h('option',{value:'Asia/Shanghai'},'北京时间'),h('option',{value:'Europe/Berlin'},'慕尼黑时间'))),
        h('div',{className:'bh-row'},h('div',null,h('strong',null,'赛前提醒'),h('p',null,'导入日历后，由日历应用提醒。')),h('select',{className:'bh-select','aria-label':'赛前提醒',value:s.prefs.lead,onChange:e=>preference('lead',Number(e.target.value))},[15,30,60,120].map(n=>h('option',{key:n,value:n},'提前 '+n+' 分钟'))))),
      h(BackupManager,{s}),
      h('details',{className:'bh-about'},h('summary',null,'关于拜仁主场 0.18.0'),h('p',{className:'bh-copy'},'非官方球迷插件。背景、偏好、阵型、球迷名片与最近赛程保存在本机；启用迷你卡时读取 OpenLigaDB 德甲、欧冠与德国杯赛程，不传送 DSH 对话或模型密钥。'),h('p',{className:'bh-copy'},'三项赛事按开球时间合并；杯赛后续轮次随抽签和数据源更新。导出的离线日历不会自动同步改期。'),h('div',{className:'bh-links'},link('https://fcbayern.com/en/matches/profis','官方赛程'),link('https://fcbayern.com/en/news','拜仁新闻'))));
  }
  function QuickRail({s}) {
    const [hovered,setHovered] = React.useState(false);
    const expanded = s.prefs.railPinned || hovered;
    const railRef = React.useRef(null), handleRef = React.useRef(null);
    const hideTimer = React.useRef(null), showTimer = React.useRef(null), pointerInside = React.useRef(false);
    const pointerType = React.useRef('mouse'), touchWasOpen = React.useRef(false);
    const cancelHide = ()=>clearTimeout(hideTimer.current);
    const reveal = ()=>{cancelHide();clearTimeout(showTimer.current);setHovered(true);if(!state.prefs.railHintSeen)preference('railHintSeen',true);};
    const scheduleHide = ()=>{
      clearTimeout(showTimer.current);cancelHide();
      hideTimer.current=setTimeout(()=>{
        const active=document.activeElement;
        if(railRef.current?.contains(active) && active.matches(':focus-visible'))return;
        if(railRef.current?.contains(active))active.blur();
        setHovered(false);
      },280);
    };
    React.useEffect(()=>()=>{clearTimeout(hideTimer.current);clearTimeout(showTimer.current);},[]);
    React.useEffect(()=>{
      if(!expanded || s.prefs.railPinned)return;
      const outside=e=>{if(!railRef.current?.contains(e.target)){clearTimeout(showTimer.current);cancelHide();setHovered(false);}};
      document.addEventListener('pointerdown',outside);
      return()=>document.removeEventListener('pointerdown',outside);
    },[expanded,s.prefs.railPinned]);
    return h('nav',{className:'bh-rail',ref:railRef,'aria-label':'拜仁快捷工具','data-expanded':expanded?'':undefined,
      onPointerEnter:e=>{if(e.pointerType==='touch')return;pointerInside.current=true;cancelHide();clearTimeout(showTimer.current);showTimer.current=setTimeout(reveal,180);},
      onPointerLeave:e=>{if(e.pointerType==='touch')return;pointerInside.current=false;scheduleHide();},
      onPointerDownCapture:e=>{pointerType.current=e.pointerType;touchWasOpen.current=expanded;},
      onFocusCapture:e=>{if(pointerType.current!=='touch' || e.target.matches(':focus-visible'))reveal();},
      onBlurCapture:e=>{if(!e.currentTarget.contains(e.relatedTarget) && !pointerInside.current)scheduleHide();},
      onKeyDown:e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();clearTimeout(showTimer.current);cancelHide();handleRef.current?.focus({preventScroll:true});setHovered(false);if(s.prefs.railPinned)preference('railPinned',false);}}
    },
      h('button',{className:'bh-rail-handle',ref:handleRef,'aria-label':'拜仁快捷工具开关','aria-expanded':expanded,'aria-controls':'bh-rail-actions',
        onClick:e=>{cancelHide();clearTimeout(showTimer.current);if(e.detail===0){if(s.prefs.railPinned)preference('railPinned',false);setHovered(!expanded);}else if(pointerType.current==='touch'){if(touchWasOpen.current && s.prefs.railPinned)preference('railPinned',false);setHovered(!touchWasOpen.current);}else reveal();if(!state.prefs.railHintSeen)preference('railHintSeen',true);}
      },h('span',{'aria-hidden':true})),
      !s.prefs.railHintSeen && !expanded ? h('span',{className:'bh-rail-hint'},'悬停展开工具',h(Icon,{name:'chevron',size:12})) : null,
      h('div',{className:'bh-rail-actions',id:'bh-rail-actions','aria-hidden':!expanded},
        h('div',{className:'bh-rail-top'},h('span',null,'主场工具'),h('button',{className:'bh-rail-pin',tabIndex:expanded?0:-1,'aria-label':s.prefs.railPinned?'取消固定快捷工具':'固定快捷工具','aria-pressed':s.prefs.railPinned,onClick:()=>preference('railPinned',!s.prefs.railPinned)},h(Icon,{name:'pin',size:14}))),
        s.prefs.railOrder.map(id=>{
          const action=id==='matches'?{label:'赛程与比分',copy:'查看赛程与赛果',icon:'calendar',click:()=>open('matches')}:id==='tactics'?{label:'战术灵感',copy:'编辑阵型与路线',icon:'tactics',click:()=>open('tactics')}:{label:s.prefs.quiet?'恢复主场':'专注阅读',copy:s.prefs.quiet?'恢复球场背景':'隐藏背景与比赛卡',icon:s.prefs.quiet?'sun':'focus',click:()=>preference('quiet',!s.prefs.quiet)};
          return h('button',{className:'bh-rail-button',key:id,'data-action':id,tabIndex:expanded?0:-1,'aria-label':action.label,...(id==='focus'?{'aria-pressed':s.prefs.quiet}:{}),onClick:action.click},h('span',{className:'bh-rail-symbol'},h(Icon,{name:action.icon})),h('span',{className:'bh-rail-label'},h('strong',null,action.label),h('small',null,action.copy)));
        })
      )
    );
  }
  function MiniMatch({s,now}) {
    if(!s.prefs.mini || s.prefs.quiet || s.activeChat)return null;
    const next=nextMatch(s.currentMatches,now), opponent=next && (next.homeId===TEAM_ID?next.away:next.home);
    return h('section',{className:'bh-mini','aria-label':'下一场比赛迷你卡'},
      h('button',{className:'bh-mini-main',onClick:()=>open('matches',true),'aria-label':'查看下一场比赛'},
        h('span',{className:'bh-mini-kicker'},h(Icon,{name:'calendar',size:13}),'下一场比赛',h('span',null,next?competitionLabel(next.competition)+' · '+(next.homeId===TEAM_ID?'主场':'客场'):'待同步')),
        h('strong',null,next?'拜仁 vs '+shortTeam(opponent):s.loading?'正在同步赛程…':'等待赛程更新'),
        h('span',{className:'bh-mini-meta'},next?dateLabel(next.kickoff,s.prefs.zone)+' · '+(s.prefs.zone==='Asia/Shanghai'?'北京':'慕尼黑'):s.error?'暂时离线，点击重试':'点击查看比赛中心'),
        h('span',{className:'bh-mini-bottom'},h('span',{className:'bh-mini-count'},next?countdown(next.kickoff,now):'MIA SAN MIA'),h('small',null,s.currentUpdatedAt?(s.currentFromCache || s.currentError && !s.currentCoverage.some(c=>c.status==='error')?'缓存 · ':s.currentCoverage.some(c=>c.status==='error')?'部分更新 · ':'更新 · ')+updatedLabel(s.currentUpdatedAt,s.prefs.zone):'北京时间 / 慕尼黑时间')),s.currentError? h('small',{className:'bh-mini-warning'},s.currentCoverage.some(c=>c.status==='error')?'部分赛事读取失败，点击查看':'赛程更新失败，点击重试'):null),
      h('button',{className:'bh-mini-dismiss','aria-label':'隐藏迷你比赛卡',onClick:()=>{preference('mini',false);notify('迷你比赛卡已隐藏，可在「主场设置」重新开启。');}},h(Icon,{name:'close',size:13})));
  }
  function Layer() {
    const s = useState(), [now,setNow] = React.useState(Date.now());
    const panelRef = React.useRef(null),moreFocusRef=React.useRef(null),wasOpenRef=React.useRef(s.open);
    React.useEffect(()=>{
      if(!s.hostPresent)return;
      const visible=s.open || (s.prefs.mini && !s.activeChat && !s.prefs.quiet);
      if(!visible)return;
      setNow(Date.now());refresh();
      const ticker=setInterval(()=>{setNow(Date.now());syncTheme();},30000);
      const poll=setInterval(()=>{if(!document.hidden)refresh();},60000);
      const visibility=()=>{if(!document.hidden){setNow(Date.now());refresh();}};
      document.addEventListener('visibilitychange',visibility);
      return()=>{clearInterval(ticker);clearInterval(poll);document.removeEventListener('visibilitychange',visibility);};
    },[s.open,s.hostPresent,s.prefs.mini,s.prefs.quiet,s.activeChat]);
    React.useEffect(()=>{if(!s.open)return;const key=e=>{if(e.defaultPrevented||e.isComposing||e.keyCode===229)return;if(e.key==='Escape'){e.preventDefault();close();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[s.open]);
    React.useEffect(()=>{if(s.open)panelRef.current?.querySelector('.bh-icon')?.focus();},[s.open]);
    React.useLayoutEffect(()=>{if(wasOpenRef.current&&!s.open)document.querySelector('.bh-launch')?.focus();wasOpenRef.current=s.open;},[s.open]);
    React.useLayoutEffect(()=>{syncTheme();},[s.hostPresent,s.open,s.prefs.panelWidth,s.prefs.miniPosition]);
    React.useLayoutEffect(()=>{const body=panelRef.current?.querySelector('.bh-body');body?.scrollTo({top:0});if(s.open&&TOOL_PAGES.some(item=>item.id===s.tab))body?.querySelector('h2')?.focus({preventScroll:true});if(s.tab==='more'&&moreFocusRef.current){document.getElementById('bh-tool-'+moreFocusRef.current)?.focus({preventScroll:true});moreFocusRef.current=null;}},[s.tab,s.open]);
    if(!s.hostPresent) return null;
    const pages = {home:Home,matches:Matches,more:More,tactics:Tactics,fan:FanCard,work:WorkAssistant,settings:Settings}, tool=TOOL_PAGES.find(item=>item.id===s.tab), primary=tool?'more':s.tab,visibleSaveStatus=s.tab==='work'?s.workSaveStatus:s.saveStatus;
    return h('div',{id:'bh-layer',className:'bh-surface'},!s.open ? h(React.Fragment,null,h(QuickRail,{s}),h(MiniMatch,{s,now}),h('button',{className:'bh-launch','aria-label':'打开拜仁主场','aria-expanded':false,onClick:()=>open()},h('img',{src:CREST,alt:''}),h('span',{className:'bh-launch-label'},'我的主场'),h(Icon,{name:'chevron',size:12}))) :
      h('aside',{className:'bh-panel','data-page':s.tab,ref:panelRef,'aria-label':'拜仁主场面板'},h('header',null,h('img',{src:CREST,alt:'拜仁慕尼黑队徽'}),h('div',null,h('strong',null,'拜仁主场'),h('small',null,'MIA SAN MIA')),h('button',{className:'bh-icon','aria-label':'收起拜仁主场',onClick:close},h(Icon,{name:'close',size:16}))),
        h('div',{className:'bh-tabs',role:'tablist','aria-label':'主场页面'},PRIMARY_PAGES.map(([id,label,icon])=>h('button',{key:id,id:'bh-tab-'+id,role:'tab','aria-selected':primary===id,'aria-controls':'bh-tabpanel',tabIndex:primary===id?0:-1,onKeyDown:e=>{const keys=PRIMARY_PAGES.map(item=>item[0]),i=keys.indexOf(id);const target=e.key==='ArrowRight'?keys[(i+1)%keys.length]:e.key==='ArrowLeft'?keys[(i+keys.length-1)%keys.length]:e.key==='Home'?keys[0]:e.key==='End'?keys[keys.length-1]:null;if(target){e.preventDefault();publish({tab:target});document.getElementById('bh-tab-'+target)?.focus();}},onClick:()=>publish({tab:id})},h(Icon,{name:icon,size:16}),h('span',null,label)))),
        h('div',{className:'bh-body',id:'bh-tabpanel',role:'tabpanel','aria-labelledby':'bh-tab-'+primary},tool?h('div',{className:'bh-breadcrumb'},h('button',{className:'bh-text-action',onClick:()=>{moreFocusRef.current=s.tab;publish({tab:'more'});}},'← 返回更多'),h('span',{'aria-hidden':true},'/'),h('span',null,tool.title)):null,h(pages[s.tab]||More,{s,now})),h('footer',{className:'bh-footer'},h('span',{className:'bh-save-status','data-status':visibleSaveStatus,role:'status','aria-live':'polite'},h('i',{'aria-hidden':true}),visibleSaveStatus==='error'?(s.tab==='work'?'工作内容未保存 · 请复制或导出':'未能保存 · 请导出备份'):visibleSaveStatus==='editing'?'正在调整…':s.tab==='work'?'工作内容已保存':'本机已保存',visibleSaveStatus==='error'&&!(s.tab==='work'&&s.workReadError)?h('button',{className:'bh-save-retry','aria-label':s.tab==='work'?'重试保存工作助手':'重试保存主场数据',onClick:s.tab==='work'?()=>saveWorkNote(s.workNote):retryLocalSave},'重试'):null),h('span',null,h('span',{className:'bh-theme-light'},'跟随系统 · 浅色'),h('span',{className:'bh-theme-dark'},'跟随系统 · 深色')))),
      s.toast ? h('div',{className:'bh-toast',role:'status'},s.toast) : null);
  }
  function Crest(props) {return h('img',{className:(props.className||'')+' bh-crest',src:CREST,alt:'拜仁慕尼黑',width:props.size||34,height:props.size||34});}
  function Dock(props) {
    const draft = props.useInput ? props.useInput(v=>v?.draft) : '';
    React.useEffect(()=>{const value=props.inputActions ? {actions:props.inputActions,draft:draft||''}:null;currentInput=value;return()=>{if(currentInput===value)currentInput=null;};},[props.inputActions,draft]);
    return null; // The input slot only binds the current draft; all visible shortcuts live on the right rail.
  }
  function apply(ctx) {
    disposed=false;
    const root=document.documentElement, style=document.createElement('style');style.dataset.plugin='dsh-bayern-home';style.textContent=CSS;document.head.appendChild(style);root.setAttribute('data-bh-enabled','');
    const marked=new Set(); let pending=0;
    function scan() {
      pending=0;
      if(disposed)return;
      for(const body of document.querySelectorAll('[data-conversation-content]')) {const host=body.closest('[data-phase]') || body;host.setAttribute('data-bh-host','');marked.add(host);}
      const present=[...marked].some(el=>el.isConnected);
      const activeChat=[...marked].some(el=>el.isConnected && !!el.querySelector('[data-content-phase="active"]'));
      if(present!==state.hostPresent || activeChat!==state.activeChat)publish({hostPresent:present,activeChat,...(!present?{open:false}:{})});
    }
    window.addEventListener('resize',syncTheme);
    const observer=new MutationObserver(()=>{if(!pending)pending=requestAnimationFrame(scan);});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-content-phase','data-phase']});scan();syncTheme();
    ctx.effect(()=>()=>{disposed=true;window.removeEventListener('resize',syncTheme);observer.disconnect();cancelAnimationFrame(pending);controller?.abort();clearTimeout(toastTimer);style.remove();for(const el of marked)el.removeAttribute('data-bh-host');for(const attr of ['data-bh-enabled','data-bh-panel','data-bh-matchday','data-bh-quiet','data-bh-active','data-bh-mini-position'])root.removeAttribute(attr);for(const name of ['--bh-strength','--bh-panel-width','--bh-mini-left','--bh-content-top'])root.style.removeProperty(name);listeners.clear();currentInput=null;});
    ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'dsh-bayern-home',order:80},Layer));
    ctx.slots.inject('conversation.hero.brand.mark',()=>ctx.slots.register({name:'conversation.hero.brand.mark',priority:-10},Crest));
    ctx.slots.inject('conversation.input.dock',()=>ctx.slots.register({name:'conversation.input.dock',id:'bayern-home-shortcuts',order:90},Dock));
  }
  return {inject:['slots'],apply};
}});
