/* Compiled by scripts/build.mjs; all artwork is embedded in the shipped client. */
window.__ModuleLoader__.load({id:'dsh-bayern-home',factory:(require)=>{
  'use strict';
  const React = require('react'), h = React.createElement;
  const CSS = __THEME_CSS__, CREST = __CREST_URI__;
  __DATA_CODE__
  __LINEUP_CODE__
  __STUDIO_CODE__
  const STORAGE = 'dsh-bayern-home:settings:v1';
  const defaults = {...DEFAULT_LAYOUT,spoiler:true,quiet:false,matchday:false,mini:true,railPinned:false,railHintSeen:false,strength:82,zone:'Asia/Shanghai',lead:30};
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
  const beforeProfiles=JSON.stringify(studio);
  studio={...studio,board:fillPlayerProfiles(studio.board,OFFICIAL_LINEUP),savedBoards:studio.savedBoards.map(row=>({...row,board:fillPlayerProfiles(row.board,OFFICIAL_LINEUP)}))};
  if(JSON.stringify(studio)!==beforeProfiles) {try {localStorage.setItem(STUDIO_STORAGE,JSON.stringify({version:1,...studio}));} catch {}}

  const initialSeason = seasonFor(), initialCache = cachedSeason(initialSeason);
  let state = {...studio,prefs,open:false,tab:'home',formation:studio.board.formation,matches:initialCache?.matches || [],loading:false,requested:!!initialCache,updatedAt:initialCache?.updatedAt || null,fromCache:!!initialCache,error:'',toast:'',hostPresent:false,activeChat:false,season:initialSeason,revealed:[],currentMatches:initialCache?.matches || [],currentUpdatedAt:initialCache?.updatedAt || null,currentFromCache:!!initialCache};
  const listeners = new Set();
  let controller = null, toastTimer = null, currentInput = null, disposed = false;
  function publish(patch) { if (disposed) return; state = {...state,...patch}; listeners.forEach(fn=>fn(state)); syncTheme(); }
  function useState() { const [value,set] = React.useState(state); React.useEffect(()=>{listeners.add(set);set(state);return ()=>listeners.delete(set);},[]); return value; }
  function syncTheme() {
    const root = document.documentElement;
    root.toggleAttribute('data-bh-panel',state.open && state.hostPresent);
    root.toggleAttribute('data-bh-quiet',state.prefs.quiet);
    root.toggleAttribute('data-bh-active',state.activeChat);
    root.toggleAttribute('data-bh-matchday',state.prefs.matchday || isMatchday(state.matches));
    root.style.setProperty('--bh-strength',String(state.prefs.strength / 100));
    root.style.setProperty('--bh-panel-width',state.prefs.panelWidth+'px');
    root.setAttribute('data-bh-mini-position',state.prefs.miniPosition);
    const host=document.querySelector('[data-bh-host]'),layer=document.getElementById('bh-layer');
    if(host && layer) {const a=host.getBoundingClientRect(),b=layer.getBoundingClientRect();root.style.setProperty('--bh-mini-left',Math.max(16,a.left-b.left+24)+'px');root.style.setProperty('--bh-content-top',Math.max(0,a.top-b.top)+'px');}
  }
  function notify(message) { clearTimeout(toastTimer);publish({toast:message});toastTimer = setTimeout(()=>publish({toast:''}),4200); }
  function preferences(patch) {
    const next={...state.prefs,...patch};Object.assign(next,normalizeLayout(next));
    publish({prefs:next,...('spoiler' in patch?{revealed:[]}:{} )});
    try {localStorage.setItem(STORAGE,JSON.stringify(next));return true;} catch {notify('当前窗口无法保存偏好，设置仅本次有效。');return false;}
  }
  function preference(key,value) {return preferences({[key]:value});}
  function saveStudio() {
    try {localStorage.setItem(STUDIO_STORAGE,JSON.stringify({version:1,...normalizeStudio(state)}));return true;}
    catch {notify('本机存储不可用，当前修改仅本次有效；可先导出名片或复制战术话题。');return false;}
  }
  function patchStudio(patch,persist=true) {publish(patch);return persist?saveStudio():true;}
  async function refresh(force = false) {
    if (state.loading || disposed) return;
    if (!force && !state.fromCache && state.updatedAt && Date.now() - state.updatedAt < 60000) return;
    controller = new AbortController(); const request = controller, season = state.season;
    const timeout = setTimeout(()=>request.abort(),12000);
    publish({loading:true,requested:true,error:''});
    try {
      const matches = await fetchSeason(season,request.signal), updatedAt = Date.now();
      if (controller !== request || disposed) return;
      publish({matches,updatedAt,fromCache:false,error:'',...(season===seasonFor()?{currentMatches:matches,currentUpdatedAt:updatedAt,currentFromCache:false}:{})});
      try {
        localStorage.setItem(CACHE_PREFIX+season,writeFixtureCache(matches,season,updatedAt));
        for (let y=2000;y<seasonFor()-2;y++) localStorage.removeItem(CACHE_PREFIX+y);
      } catch {} // Storage may be unavailable or full; keep the in-memory result usable.
    } catch(error) {
      if(controller === request && !disposed) publish({error:error.name === 'AbortError' ? '赛程读取超时，请稍后重试。' : '暂时无法连接 OpenLigaDB；请检查网络后重试。'});
    } finally {
      clearTimeout(timeout);
      if(controller === request) {controller = null;publish({loading:false});}
    }
  }
  function chooseSeason(season) {
    controller?.abort();controller=null;
    const cache=cachedSeason(season);
    publish({season,matches:cache?.matches || [],updatedAt:cache?.updatedAt || null,fromCache:!!cache,requested:!!cache,loading:false,error:'',revealed:[]});
    refresh(true);
  }
  function open(tab = 'home', currentSeason = false) {
    publish({open:true,tab});
    if(currentSeason && state.season!==seasonFor())chooseSeason(seasonFor());else refresh();
  }
  function close() {
    publish({open:false,revealed:[]});
    if(state.season!==seasonFor()) {
      controller?.abort();controller=null;const cache=cachedSeason(seasonFor());
      publish({season:seasonFor(),matches:cache?.matches || [],updatedAt:cache?.updatedAt || null,fromCache:!!cache,requested:!!cache,loading:false,error:''});
    }
    setTimeout(()=>document.querySelector('.bh-launch')?.focus(),0);
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
    h('span',{className:'bh-source-label'},s.updatedAt ? `${s.fromCache || s.error ? '本机缓存' : '更新于'} ${updatedLabel(s.updatedAt,s.prefs.zone)} · ${s.season}/${s.season+1} 德甲` : '尚未读取赛程'),
    h('br'),s.error && s.updatedAt ? '保留上次赛程，比分与开球时间可能已变化。' : s.fromCache ? '正在尝试更新；缓存最长保留 30 天。' : 'OpenLigaDB 社区数据 · 比分可能延迟',
    h('div',{className:'bh-links'},link('https://www.openligadb.de','数据来源'),link('https://fcbayern.com/en/matches/profis','官方全赛事赛程'))); }
  function failure(s) {return s.error ? h('div',{role:'status',className:'bh-alert bh-error'},s.error) : null;}
  function Home({s,now}) {
    const next = nextMatch(s.matches,now), opponent = next && (next.homeId === TEAM_ID ? next.away : next.home);
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'WILLKOMMEN ZU HAUSE'),h('h2',null,'热爱，自有主场。'),h('p',{className:'bh-copy'},'从日常聊天，到每一个比赛日。'),
      h('article',{className:'bh-stage'},h('div',{className:'bh-stage-top'},h('span',null,h('i',{className:'bh-dot'}),'下一场德甲'),h('span',{className:'bh-tag'},next ? (next.homeId === TEAM_ID ? '主场' : '客场') : '待同步')),
        h('div',{className:'bh-team-pair'},h('img',{src:CREST,alt:'拜仁队徽'}),h('div',null,h('strong',null,next ? `拜仁 vs ${shortTeam(opponent)}` : '下一次，为拜仁而来。'),h('small',null,next ? dateLabel(next.kickoff,s.prefs.zone) : s.loading ? '正在读取真实赛程…' : '等待数据源提供赛程'))),
        h('div',{className:'bh-count'},next ? countdown(next.kickoff,now) : 'MIA SAN MIA'),h('small',{className:'bh-caption'},next ? '距离开球 · '+(s.prefs.zone==='Asia/Shanghai'?'北京时间':'慕尼黑时间') : '每一份热爱，都有自己的主场'),
        next ? h('button',{className:'bh-button bh-primary bh-wide',onClick:()=>downloadCalendar(next)},'＋ 加入我的比赛日历') : null),
      failure(s),!s.loading && s.requested && !s.error && !next ? h('div',{className:'bh-alert'},'该赛季暂未提供下一场已确认时间的德甲比赛。可打开官方全赛事赛程查看。') : null,
      h('div',{className:'bh-creative-links'},[['tactics','tactics','战术工作室','摆出你的想法'],['fan','card','名片工坊','写上你的名字'],['layout','layout','主场布局','调成你的习惯']].map(([id,icon,title,copy])=>h('button',{key:id,onClick:()=>publish({tab:id})},h(Icon,{name:icon,size:20}),h('strong',null,title),h('small',null,copy)))),
      h('section',{className:'bh-preferences','aria-label':'主场偏好'},toggle('封存赛果','补看比赛之前，替你藏好比分。','spoiler',s),toggle('点亮主场','红色比赛日氛围；真实比赛日自动点亮。','matchday',s),toggle('专注阅读','暂时收起背景，留住阅读节奏。','quiet',s)),
      h('button',{className:'bh-button bh-wide',onClick:()=>publish({tab:'matches'})},'查看赛程与比分 →'),sources(s));
  }
  function Matches({s,now}) {
    const [mode,setMode] = React.useState('upcoming');
    const future = s.matches.filter(m=>!m.finished), results = s.matches.filter(m=>m.finished).reverse();
    const groups = fixtureGroups(mode==='upcoming'?future:results,s.prefs.zone);
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'MATCHDAY CENTER'),h('h2',null,'不错过，每一场。'),h('p',{className:'bh-copy'},'按月份整理赛程，比分由你决定何时揭晓。'),
      h('div',{className:'bh-topline'},h('div',{className:'bh-segment'},h('button',{className:'bh-button','aria-pressed':mode==='upcoming',onClick:()=>setMode('upcoming')},'待赛'),h('button',{className:'bh-button','aria-pressed':mode==='results',onClick:()=>setMode('results')},'赛果')),h('button',{className:'bh-button',disabled:s.loading,onClick:()=>refresh(true)},s.loading?'读取中…':'↻ 刷新')),
      h('div',{className:'bh-topline'},h('p',null,s.prefs.zone==='Asia/Shanghai'?'北京时间':'慕尼黑时间'),h('label',null,h('span',{className:'bh-field-label'},'赛季'),h('select',{className:'bh-select','aria-label':'赛季',value:s.season,onChange:e=>chooseSeason(Number(e.target.value))},[seasonFor(),seasonFor()-1,seasonFor()-2].map(y=>h('option',{key:y,value:y},`${y}/${String(y+1).slice(2)}`))))),
      toggle('封存赛果','单场可以单独揭晓，其他比分继续封存。','spoiler',s),failure(s),
      s.fromCache && s.updatedAt ? h('div',{className:'bh-cache-note',role:'status'},'本机缓存 · '+updatedLabel(s.updatedAt,s.prefs.zone)+(s.loading?' · 更新中':' · 请以最新赛程为准')) : null,
      s.loading && !s.matches.length ? h('div',{className:'bh-alert',role:'status'},'正在读取赛程…') : !groups.length ? h('div',{className:'bh-alert'},'这个列表暂时没有数据。可刷新或切换赛季。') : null,
      groups.map(({label,matches})=>h('section',{className:'bh-month',key:label,'aria-label':label},h('h3',{className:'bh-month-label'},label,h('span',null,matches.length+' 场')),
        matches.map(m=>{
          const available=canRevealScore(m,now), sealed=available && s.prefs.spoiler && !s.revealed.includes(m.id);
          return h('article',{className:'bh-fixture',key:m.id},h('div',{className:'bh-fixture-meta'},h('small',null,dateLabel(m.kickoff,s.prefs.zone)),h('span',{className:'bh-match-state','data-state':m.finished?'finished':available?'unconfirmed':'upcoming'},matchState(m,now))),
            h('div',{className:'bh-fixture-teams'},h('span',null,shortTeam(m.home)),sealed ? h('button',{className:'bh-score sealed','aria-label':`揭晓 ${shortTeam(m.home)} 对 ${shortTeam(m.away)} 的比分`,onClick:()=>revealScore(m.id)},h(Icon,{name:'eye',size:14}),'揭晓比分') : h('b',{className:'bh-score'},scoreText(m,false,now)),h('span',null,shortTeam(m.away))),
            h('div',{className:'bh-fixture-foot'},h('small',null,m.round),!available && m.kickoff ? h('button',{onClick:()=>downloadCalendar(m)},'＋ 日历提醒') : available && s.prefs.spoiler && !sealed ? h('button',{onClick:()=>revealScore(m.id),'aria-label':`重新封存 ${shortTeam(m.home)} 对 ${shortTeam(m.away)} 的比分`},'重新封存') : link(m.source,'原始数据')));
        }))),sources(s));
  }
  __STUDIO_UI__
  function Settings({s}) {
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'MAKE IT YOURS'),h('h2',null,'你的习惯，你的主场。'),h('p',{className:'bh-copy'},'一套设计，两种光线。'),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'外观 · 自动跟随 Windows'),h('p',null,'同一座球场、同一面旗帜、同一个构图。')),h('span',{style:{fontSize:'11px',color:'var(--bh-red)'}},h('span',{className:'bh-theme-light'},'日场'),h('span',{className:'bh-theme-dark'},'夜场'))),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'背景浓度'),h('p',null,'对话开始后，背景会自动降低亮度。')),h('span',null,s.prefs.strength+'%')),
      h('input',{className:'bh-range',type:'range',min:20,max:100,value:s.prefs.strength,'aria-label':'背景浓度',onChange:e=>preference('strength',Number(e.target.value))}),toggle('迷你比赛卡','在主场入口下显示下一场；聊天时自动收起。','mini',s),toggle('固定快捷工具','保持右侧三个工具展开；Esc 可取消固定。','railPinned',s),toggle('专注阅读','需要时，一键收起背景。','quiet',s),toggle('封存赛果','隐藏面板中所有比赛的比分。','spoiler',s),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'显示时区'),h('p',null,'德国夏令时自动换算。')),h('select',{className:'bh-select','aria-label':'显示时区',value:s.prefs.zone,onChange:e=>preference('zone',e.target.value)},h('option',{value:'Asia/Shanghai'},'北京时间'),h('option',{value:'Europe/Berlin'},'慕尼黑时间'))),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'赛前提醒'),h('p',null,'导入日历后，由日历应用提醒。')),h('select',{className:'bh-select','aria-label':'赛前提醒',value:s.prefs.lead,onChange:e=>preference('lead',Number(e.target.value))},[15,30,60,120].map(n=>h('option',{key:n,value:n},`提前 ${n} 分钟`)))),
      h('h3',null,'关于这座主场'),h('p',{className:'bh-copy'},'拜仁主场 0.5.2 · 非官方球迷插件。背景、偏好、阵型、球迷名片与最近赛程保存在本机；启用迷你卡时自动读取德甲赛程，不传送 DSH 对话或模型密钥。'),h('p',{className:'bh-copy'},'当前内置德甲数据。欧冠、德国杯请查看官方全赛事赛程。刷新不会创建通知；导出的离线日历不会自动同步改期。'),h('div',{className:'bh-links'},link('https://fcbayern.com/en/matches/profis','官方赛程'),link('https://fcbayern.com/en/news','拜仁新闻')));
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
          const action=id==='matches'?{label:'赛程与比分',copy:'下一场，别错过',icon:'calendar',click:()=>open('matches')}:id==='tactics'?{label:'战术灵感',copy:'把阵型摊开聊',icon:'tactics',click:()=>open('tactics')}:{label:s.prefs.quiet?'恢复主场':'专注阅读',copy:s.prefs.quiet?'让热爱回到眼前':'留一点安静给思考',icon:s.prefs.quiet?'sun':'focus',click:()=>preference('quiet',!s.prefs.quiet)};
          return h('button',{className:'bh-rail-button',key:id,'data-action':id,tabIndex:expanded?0:-1,'aria-label':action.label,...(id==='focus'?{'aria-pressed':s.prefs.quiet}:{}),onClick:action.click},h('span',{className:'bh-rail-symbol'},h(Icon,{name:action.icon})),h('span',{className:'bh-rail-label'},h('strong',null,action.label),h('small',null,action.copy)));
        })
      )
    );
  }
  function MiniMatch({s,now}) {
    if(!s.prefs.mini || s.prefs.quiet || s.activeChat)return null;
    const next=nextMatch(s.currentMatches,now), opponent=next && (next.homeId===TEAM_ID?next.away:next.home);
    return h('section',{className:'bh-mini','aria-label':'下一场德甲迷你卡'},
      h('button',{className:'bh-mini-main',onClick:()=>open('matches',true),'aria-label':'查看下一场德甲比赛'},
        h('span',{className:'bh-mini-kicker'},h(Icon,{name:'calendar',size:13}),'下一场德甲',h('span',null,next?(next.homeId===TEAM_ID?'主场':'客场'):'待同步')),
        h('strong',null,next?'拜仁 vs '+shortTeam(opponent):s.loading?'正在同步赛程…':'等待赛程更新'),
        h('span',{className:'bh-mini-meta'},next?dateLabel(next.kickoff,s.prefs.zone)+' · '+(s.prefs.zone==='Asia/Shanghai'?'北京':'慕尼黑'):s.error?'暂时离线，点击重试':'点击查看比赛中心'),
        h('span',{className:'bh-mini-bottom'},h('span',{className:'bh-mini-count'},next?countdown(next.kickoff,now):'MIA SAN MIA'),h('small',null,s.currentUpdatedAt?(s.currentFromCache || s.error?'缓存 · ':'更新 · ')+updatedLabel(s.currentUpdatedAt,s.prefs.zone):'北京时间 / 慕尼黑时间'))),
      h('button',{className:'bh-mini-dismiss','aria-label':'隐藏迷你比赛卡',onClick:()=>{preference('mini',false);notify('迷你比赛卡已隐藏，可在「外观」重新开启。');}},h(Icon,{name:'close',size:13})));
  }
  function Layer() {
    const s = useState(), [now,setNow] = React.useState(Date.now());
    const panelRef = React.useRef(null);
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
    React.useEffect(()=>{if(!s.open)return;const key=e=>{if(e.key==='Escape'){e.preventDefault();close();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[s.open]);
    React.useEffect(()=>{if(s.open)panelRef.current?.querySelector('.bh-icon')?.focus();},[s.open]);
    React.useLayoutEffect(()=>{syncTheme();},[s.hostPresent,s.open,s.prefs.panelWidth,s.prefs.miniPosition]);
    React.useLayoutEffect(()=>{panelRef.current?.querySelector('.bh-body')?.scrollTo({top:0});},[s.tab,s.open]);
    if(!s.hostPresent) return null;
    const pages = {home:Home,matches:Matches,tactics:Tactics,fan:FanCard,layout:LayoutEditor,settings:Settings};
    return h('div',{id:'bh-layer',className:'bh-surface'},!s.open ? h(React.Fragment,null,h(QuickRail,{s}),h(MiniMatch,{s,now}),h('button',{className:'bh-launch','aria-label':'打开拜仁主场','aria-expanded':false,onClick:()=>open()},h('img',{src:CREST,alt:''}),h('span',{className:'bh-launch-label'},'我的主场'),h(Icon,{name:'chevron',size:12}))) :
      h('aside',{className:'bh-panel',ref:panelRef,'aria-label':'拜仁主场面板'},h('header',null,h('img',{src:CREST,alt:'拜仁慕尼黑队徽'}),h('div',null,h('strong',null,'MIA SAN MIA'),h('small',null,'你的拜仁，随时在场。')),h('button',{className:'bh-icon','aria-label':'收起拜仁主场',onClick:close},h(Icon,{name:'close',size:16}))),
        h('div',{className:'bh-tabs',role:'tablist','aria-label':'主场页面'},[['home','主场','home'],['matches','比赛','calendar'],['tactics','战术','tactics'],['fan','名片','card'],['layout','布局','layout'],['settings','外观','sun']].map(([id,label,icon])=>h('button',{key:id,id:'bh-tab-'+id,role:'tab','aria-selected':s.tab===id,'aria-controls':'bh-tabpanel',tabIndex:s.tab===id?0:-1,onKeyDown:e=>{const keys=['home','matches','tactics','fan','layout','settings'],i=keys.indexOf(id);const target=e.key==='ArrowRight'?keys[(i+1)%6]:e.key==='ArrowLeft'?keys[(i+5)%6]:e.key==='Home'?keys[0]:e.key==='End'?keys[5]:null;if(target){e.preventDefault();publish({tab:target});document.getElementById('bh-tab-'+target)?.focus();}},onClick:()=>publish({tab:id})},h(Icon,{name:icon,size:16}),h('span',null,label)))),
        h('div',{className:'bh-body',id:'bh-tabpanel',role:'tabpanel','aria-labelledby':'bh-tab-'+s.tab},h(pages[s.tab],{s,now})),h('footer',{className:'bh-footer'},h('span',null,'FC BAYERN · FAN-MADE'),h('span',null,h('span',{className:'bh-theme-light'},'☀ 系统浅色 · 日场'),h('span',{className:'bh-theme-dark'},'☾ 系统深色 · 夜场')))),
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
