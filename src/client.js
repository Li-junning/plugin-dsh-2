/* Compiled by scripts/build.mjs; all artwork is embedded in the shipped client. */
window.__ModuleLoader__.load({id:'dsh-bayern-home',factory:(require)=>{
  'use strict';
  const React = require('react'), h = React.createElement;
  const CSS = __THEME_CSS__, CREST = __CREST_URI__;
  __DATA_CODE__
  const STORAGE = 'dsh-bayern-home:settings:v1';
  const defaults = {spoiler:true,quiet:false,matchday:false,strength:82,zone:'Asia/Shanghai',lead:30};
  let prefs = {...defaults};
  try { const p = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    for (const key of ['spoiler','quiet','matchday']) if (typeof p[key] === 'boolean') prefs[key] = p[key];
    if (Number.isFinite(p.strength)) prefs.strength = Math.max(20,Math.min(100,p.strength));
    if (['Asia/Shanghai','Europe/Berlin'].includes(p.zone)) prefs.zone = p.zone;
    if ([15,30,60,120].includes(p.lead)) prefs.lead = p.lead;
  } catch {}
  let state = {prefs,open:false,tab:'home',formation:'4231',matches:[],loading:false,requested:false,updatedAt:null,error:'',toast:'',hostPresent:false,season:seasonFor()};
  const listeners = new Set();
  let controller = null, toastTimer = null, currentInput = null, disposed = false;
  function publish(patch) { if (disposed) return; state = {...state,...patch}; listeners.forEach(fn=>fn(state)); syncTheme(); }
  function useState() { const [value,set] = React.useState(state); React.useEffect(()=>{listeners.add(set);set(state);return ()=>listeners.delete(set);},[]); return value; }
  function syncTheme() {
    const root = document.documentElement;
    root.toggleAttribute('data-bh-panel',state.open && state.hostPresent);
    root.toggleAttribute('data-bh-quiet',state.prefs.quiet);
    root.toggleAttribute('data-bh-matchday',state.prefs.matchday || isMatchday(state.matches));
    root.style.setProperty('--bh-strength',String(state.prefs.strength / 100));
  }
  function notify(message) { clearTimeout(toastTimer);publish({toast:message});toastTimer = setTimeout(()=>publish({toast:''}),4200); }
  function preference(key,value) {
    const next = {...state.prefs,[key]:value}; publish({prefs:next});
    try {localStorage.setItem(STORAGE,JSON.stringify(next));} catch {notify('当前窗口无法保存偏好，设置仅本次有效。');}
  }
  async function refresh(force = false) {
    if (state.loading || disposed) return;
    if (!force && state.updatedAt && Date.now() - state.updatedAt < 60000) return;
    controller = new AbortController(); const request = controller;
    const timeout = setTimeout(()=>request.abort(),12000);
    publish({loading:true,requested:true,error:''});
    try { const matches = await fetchSeason(state.season,request.signal); publish({matches,updatedAt:Date.now(),error:''}); }
    catch(error) {publish({error:error.name === 'AbortError' ? '赛程读取超时，请稍后重试。' : '暂时无法连接 OpenLigaDB；请检查网络后重试。'});}
    finally {clearTimeout(timeout); if(controller === request) controller = null;publish({loading:false});}
  }
  function open(tab = 'home') {publish({open:true,tab});refresh();}
  function close() {publish({open:false});setTimeout(()=>document.querySelector('.bh-launch')?.focus(),0);}
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
      close:[['path',{d:'m6 6 12 12M6 18 18 6'}]]
    };
    return h('svg',{className:'bh-glyph',width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,focusable:false},(shapes[name]||shapes.chevron).map(([tag,attrs],i)=>h(tag,{...attrs,key:i})));
  }
  function toggle(label,detail,key,s) { return h('div',{className:'bh-row',key},h('div',null,h('strong',null,label),h('p',null,detail)),h('button',{className:'bh-switch',type:'button',role:'switch','aria-label':label,'aria-checked':s.prefs[key],onClick:()=>preference(key,!s.prefs[key])})); }
  const link = (url,text) => h('a',{href:url,target:'_blank',rel:'noopener noreferrer'},text+' ↗');
  function sources(s) { return h('div',{className:'bh-status'},
    s.updatedAt ? `更新于 ${new Intl.DateTimeFormat('zh-CN',{timeZone:s.prefs.zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(s.updatedAt))} · ${s.season}/${s.season+1} 德甲` : '尚未读取赛程',
    h('br'),s.error && s.updatedAt ? '当前保留上次读取的数据，可能已过期。' : 'OpenLigaDB 社区数据 · 比分可能延迟',
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
      h('section',{className:'bh-preferences','aria-label':'主场偏好'},toggle('封存赛果','补看比赛之前，替你藏好比分。','spoiler',s),toggle('点亮主场','红色比赛日氛围；真实比赛日自动点亮。','matchday',s),toggle('专注阅读','暂时收起背景，留住阅读节奏。','quiet',s)),
      h('button',{className:'bh-button bh-wide',onClick:()=>publish({tab:'matches'})},'查看赛程与比分 →'),sources(s));
  }
  function Matches({s,now}) {
    const [mode,setMode] = React.useState('upcoming');
    const future = s.matches.filter(m=>!m.finished), results = s.matches.filter(m=>m.finished).reverse();
    const rows = (mode==='upcoming'?future:results).slice(0,18);
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'MATCHDAY CENTER'),h('h2',null,'不错过，每一场。'),h('p',{className:'bh-copy'},'德甲赛程与数据源当前记录的比分。'),
      h('div',{className:'bh-topline'},h('div',{className:'bh-segment'},h('button',{className:'bh-button','aria-pressed':mode==='upcoming',onClick:()=>setMode('upcoming')},'待赛'),h('button',{className:'bh-button','aria-pressed':mode==='results',onClick:()=>setMode('results')},'赛果')),h('button',{className:'bh-button',disabled:s.loading,onClick:()=>refresh(true)},s.loading?'读取中…':'↻ 刷新')),
      h('div',{className:'bh-topline'},h('p',null,s.prefs.zone==='Asia/Shanghai'?'北京时间':'慕尼黑时间'),h('label',null,h('span',{style:{fontSize:'11px',marginRight:'5px'}},'赛季'),h('select',{className:'bh-select','aria-label':'赛季',disabled:s.loading,value:s.season,onChange:e=>{publish({season:Number(e.target.value),matches:[],updatedAt:null,error:''});setTimeout(()=>refresh(true),0);}},[seasonFor(),seasonFor()-1,seasonFor()-2].map(y=>h('option',{key:y,value:y},`${y}/${String(y+1).slice(2)}`))))),
      toggle('封存赛果','关闭后才显示比分；数据源可能延迟。','spoiler',s),failure(s),
      s.loading && !s.matches.length ? h('div',{className:'bh-alert',role:'status'},'正在读取赛程…') : !rows.length ? h('div',{className:'bh-alert'},'这个列表暂时没有数据。可刷新或切换赛季。') : null,
      rows.map(m=>h('article',{className:'bh-fixture',key:m.id},h('small',null,dateLabel(m.kickoff,s.prefs.zone)+' · '+m.round),
        h('div',{className:'bh-fixture-teams'},h('span',null,shortTeam(m.home)),h('b',{className:'bh-score'+(s.prefs.spoiler?' sealed':'')},scoreText(m,s.prefs.spoiler,now)),h('span',null,shortTeam(m.away))),
        h('div',{className:'bh-fixture-foot'},h('small',null,matchState(m,now)),!m.finished && m.kickoff && Date.parse(m.kickoff)>now ? h('button',{onClick:()=>downloadCalendar(m)},'＋ 日历提醒') : link(m.source,'原始数据')))),sources(s));
  }
  const formations = {
    '4231':[[50,89,'1','门将'],[16,71,'2','左后卫'],[38,75,'4','中卫'],[62,75,'5','中卫'],[84,71,'3','右后卫'],[35,53,'6','后腰'],[65,53,'8','后腰'],[18,31,'11','左边锋'],[50,33,'10','前腰'],[82,31,'7','右边锋'],[50,13,'9','中锋']],
    '433':[[50,89,'1','门将'],[16,71,'2','左后卫'],[38,75,'4','中卫'],[62,75,'5','中卫'],[84,71,'3','右后卫'],[50,56,'6','后腰'],[29,42,'8','中前卫'],[71,42,'10','中前卫'],[18,22,'11','左边锋'],[50,13,'9','中锋'],[82,22,'7','右边锋']]
  };
  function Tactics({s}) {
    const [prompt,setPrompt] = React.useState('');
    function discuss() { const text = promptFor(s.formation);
      if (currentInput) {currentInput.actions.setDraft(currentInput.draft ? currentInput.draft+'\n\n'+text : text);notify('战术话题已放入对话框，确认后即可发送。');close();}
      else {setPrompt(text);notify('先选一个 DSH 对话，或复制下面的战术话题。');}
    }
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'TACTICS STUDIO'),h('h2',null,'聊球，也聊门道。'),h('p',{className:'bh-copy'},'把阵型摊开，让每一个站位都有理由。'),h('div',{className:'bh-segment'},['4231','433'].map(f=>h('button',{key:f,className:'bh-button','aria-pressed':s.formation===f,onClick:()=>publish({formation:f})},f==='4231'?'4-2-3-1':'4-3-3'))),
      h('div',{className:'bh-pitch','aria-label':'通用阵型角色示意，不代表实际首发'},h('div',{className:'bh-pitch-lines'}),formations[s.formation].map(([x,y,n,label])=>h('div',{className:'bh-player'+(n==='1'?' bh-goalkeeper':''),key:n,style:{left:x+'%',top:y+'%'}},h('b',null,n),label))),
      h('p',{className:'bh-copy'},s.formation==='4231'?'双后腰保护中路，前腰串联进攻。试着观察两个边路如何拉开宽度。':'单后腰与双中前卫组成三角，三前锋拉开宽度。试着寻找中场接应角度。'),
      h('button',{className:'bh-button bh-primary bh-wide',onClick:discuss},'带着这张战术板聊球 ↗'),prompt ? h('textarea',{readOnly:true,value:prompt,'aria-label':'可复制的战术话题',style:{width:'100%',minHeight:'140px',marginTop:'14px',background:'var(--bh-soft)',color:'var(--bh-text)',border:'1px solid var(--bh-line)',borderRadius:'8px',padding:'12px'},onFocus:e=>e.target.select()}) : null,
      h('div',{className:'bh-status'},'通用角色用于阵型讲解，不代表拜仁当前球员、首发或近期战术。由 DSH 已配置的模型生成回答。'));
  }
  function Settings({s}) {
    return h(React.Fragment,null,h('span',{className:'bh-eyebrow'},'MAKE IT YOURS'),h('h2',null,'你的习惯，你的主场。'),h('p',{className:'bh-copy'},'一套设计，两种光线。'),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'外观 · 自动跟随 Windows'),h('p',null,'同一座球场、同一面旗帜、同一个构图。')),h('span',{style:{fontSize:'11px',color:'var(--bh-red)'}},h('span',{className:'bh-theme-light'},'日场'),h('span',{className:'bh-theme-dark'},'夜场'))),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'背景浓度'),h('p',null,'对话开始后，背景会自动降低亮度。')),h('span',null,s.prefs.strength+'%')),
      h('input',{className:'bh-range',type:'range',min:20,max:100,value:s.prefs.strength,'aria-label':'背景浓度',onChange:e=>preference('strength',Number(e.target.value))}),toggle('专注阅读','需要时，一键收起背景。','quiet',s),toggle('封存赛果','隐藏面板中所有比赛的比分。','spoiler',s),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'显示时区'),h('p',null,'德国夏令时自动换算。')),h('select',{className:'bh-select','aria-label':'显示时区',value:s.prefs.zone,onChange:e=>preference('zone',e.target.value)},h('option',{value:'Asia/Shanghai'},'北京时间'),h('option',{value:'Europe/Berlin'},'慕尼黑时间'))),
      h('div',{className:'bh-row'},h('div',null,h('strong',null,'赛前提醒'),h('p',null,'导入日历后，由日历应用提醒。')),h('select',{className:'bh-select','aria-label':'赛前提醒',value:s.prefs.lead,onChange:e=>preference('lead',Number(e.target.value))},[15,30,60,120].map(n=>h('option',{key:n,value:n},`提前 ${n} 分钟`)))),
      h('h3',null,'关于这座主场'),h('p',{className:'bh-copy'},'拜仁主场 0.2.0 · 非官方球迷插件。背景与偏好保存在本机；查看赛程时直接请求 OpenLigaDB，不传送 DSH 对话或模型密钥。'),h('p',{className:'bh-copy'},'当前内置德甲数据。欧冠、德国杯请查看官方全赛事赛程。刷新不会创建通知；导出的离线日历不会自动同步改期。'),h('div',{className:'bh-links'},link('https://fcbayern.com/en/matches/profis','官方赛程'),link('https://fcbayern.com/en/news','拜仁新闻')));
  }
  function QuickRail({s}) {
    const [expanded,setExpanded] = React.useState(false);
    const railRef = React.useRef(null), handleRef = React.useRef(null);
    const hideTimer = React.useRef(null), pointerInside = React.useRef(false);
    const pointerType = React.useRef('mouse'), touchWasOpen = React.useRef(false);
    const cancelHide = ()=>clearTimeout(hideTimer.current);
    const reveal = ()=>{cancelHide();setExpanded(true);};
    const scheduleHide = ()=>{
      cancelHide();
      hideTimer.current=setTimeout(()=>{
        const active=document.activeElement;
        if(railRef.current?.contains(active) && active.matches(':focus-visible'))return;
        if(railRef.current?.contains(active))active.blur();
        setExpanded(false);
      },200);
    };
    React.useEffect(()=>()=>clearTimeout(hideTimer.current),[]);
    React.useEffect(()=>{
      if(!expanded)return;
      const outside=e=>{if(!railRef.current?.contains(e.target)){cancelHide();setExpanded(false);}};
      document.addEventListener('pointerdown',outside);
      return()=>document.removeEventListener('pointerdown',outside);
    },[expanded]);
    return h('nav',{className:'bh-rail',ref:railRef,'aria-label':'拜仁快捷工具','data-expanded':expanded?'':undefined,
      onPointerEnter:e=>{if(e.pointerType==='touch')return;pointerInside.current=true;reveal();},
      onPointerLeave:e=>{if(e.pointerType==='touch')return;pointerInside.current=false;scheduleHide();},
      onPointerDownCapture:e=>{pointerType.current=e.pointerType;touchWasOpen.current=expanded;},
      onFocusCapture:reveal,
      onBlurCapture:e=>{if(!e.currentTarget.contains(e.relatedTarget) && !pointerInside.current)scheduleHide();},
      onKeyDown:e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelHide();handleRef.current?.focus({preventScroll:true});setExpanded(false);}}
    },
      h('button',{className:'bh-rail-handle',ref:handleRef,'aria-label':'拜仁快捷工具开关','aria-expanded':expanded,'aria-controls':'bh-rail-actions',
        onClick:e=>{cancelHide();if(e.detail===0)setExpanded(value=>!value);else if(pointerType.current==='touch')setExpanded(!touchWasOpen.current);else setExpanded(true);}
      },h('span',{'aria-hidden':true})),
      h('div',{className:'bh-rail-actions',id:'bh-rail-actions','aria-hidden':!expanded},
        h('button',{className:'bh-rail-button',tabIndex:expanded?0:-1,'aria-label':'赛程与比分',onClick:()=>open('matches')},h('span',{className:'bh-rail-symbol'},h(Icon,{name:'calendar'})),h('span',{className:'bh-rail-label'},h('strong',null,'赛程与比分'),h('small',null,'下一场，别错过'))),
        h('button',{className:'bh-rail-button',tabIndex:expanded?0:-1,'aria-label':'战术灵感',onClick:()=>open('tactics')},h('span',{className:'bh-rail-symbol'},h(Icon,{name:'tactics'})),h('span',{className:'bh-rail-label'},h('strong',null,'战术灵感'),h('small',null,'把阵型摊开聊'))),
        h('button',{className:'bh-rail-button',tabIndex:expanded?0:-1,'aria-label':s.prefs.quiet?'恢复主场':'专注阅读','aria-pressed':s.prefs.quiet,onClick:()=>preference('quiet',!s.prefs.quiet)},h('span',{className:'bh-rail-symbol'},h(Icon,{name:s.prefs.quiet?'sun':'focus'})),h('span',{className:'bh-rail-label'},h('strong',null,s.prefs.quiet?'恢复主场':'专注阅读'),h('small',null,s.prefs.quiet?'让热爱回到眼前':'留一点安静给思考')))
      )
    );
  }
  function Layer() {
    const s = useState(), [now,setNow] = React.useState(Date.now());
    const panelRef = React.useRef(null);
    React.useEffect(()=>{if(!s.open)return;const ticker=setInterval(()=>{setNow(Date.now());syncTheme();},30000);const poll=setInterval(()=>{if(!document.hidden)refresh();},60000);const key=e=>{if(e.key==='Escape'){e.preventDefault();close();}};window.addEventListener('keydown',key);return()=>{clearInterval(ticker);clearInterval(poll);window.removeEventListener('keydown',key);};},[s.open]);
    React.useEffect(()=>{if(s.open)panelRef.current?.querySelector('.bh-icon')?.focus();},[s.open]);
    if(!s.hostPresent) return null;
    const pages = {home:Home,matches:Matches,tactics:Tactics,settings:Settings};
    return h('div',{id:'bh-layer',className:'bh-surface'},!s.open ? h(React.Fragment,null,h(QuickRail,{s}),h('button',{className:'bh-launch','aria-label':'打开拜仁主场','aria-expanded':false,onClick:()=>open()},h('img',{src:CREST,alt:''}),h('span',{className:'bh-launch-label'},'我的主场'),h('small',{className:'bh-launch-mode'},h('span',{className:'bh-theme-light'},h(Icon,{name:'sun',size:12}),'日场'),h('span',{className:'bh-theme-dark'},h(Icon,{name:'moon',size:12}),'夜场')),h(Icon,{name:'chevron',size:12}))) :
      h('aside',{className:'bh-panel',ref:panelRef,'aria-label':'拜仁主场面板'},h('header',null,h('img',{src:CREST,alt:'拜仁慕尼黑队徽'}),h('div',null,h('strong',null,'MIA SAN MIA'),h('small',null,'你的拜仁，随时在场。')),h('button',{className:'bh-icon','aria-label':'收起拜仁主场',onClick:close},h(Icon,{name:'close',size:16}))),
        h('div',{className:'bh-tabs',role:'tablist','aria-label':'主场页面'},[['home','主场'],['matches','比赛'],['tactics','战术'],['settings','外观']].map(([id,label])=>h('button',{key:id,id:'bh-tab-'+id,role:'tab','aria-selected':s.tab===id,'aria-controls':'bh-tabpanel',onClick:()=>publish({tab:id})},label))),
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
      if(present!==state.hostPresent)publish({hostPresent:present,...(!present?{open:false}:{})});
    }
    const observer=new MutationObserver(()=>{if(!pending)pending=requestAnimationFrame(scan);});observer.observe(document.body,{childList:true,subtree:true});scan();syncTheme();
    ctx.effect(()=>()=>{disposed=true;observer.disconnect();cancelAnimationFrame(pending);controller?.abort();clearTimeout(toastTimer);style.remove();for(const el of marked)el.removeAttribute('data-bh-host');for(const attr of ['data-bh-enabled','data-bh-panel','data-bh-matchday','data-bh-quiet'])root.removeAttribute(attr);root.style.removeProperty('--bh-strength');listeners.clear();currentInput=null;});
    ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'dsh-bayern-home',order:80},Layer));
    ctx.slots.inject('conversation.hero.brand.mark',()=>ctx.slots.register({name:'conversation.hero.brand.mark',priority:-10},Crest));
    ctx.slots.inject('conversation.input.dock',()=>ctx.slots.register({name:'conversation.input.dock',id:'bayern-home-shortcuts',order:90},Dock));
  }
  return {inject:['slots'],apply};
}});
