export const STUDIO_STORAGE = 'dsh-bayern-home:studio:v1';
export const DEFAULT_TACTIC_VIEW = {selected:'p9',title:'我的主场阵型'};
export const DEFAULT_LAYOUT = {panelWidth:420,miniPosition:'top-right',railOrder:['matches','tactics','focus']};
const FORMATIONS = {
  '4231':[[50,89,'1','门将'],[16,71,'2','左后卫'],[38,75,'4','中卫'],[62,75,'5','中卫'],[84,71,'3','右后卫'],[35,53,'6','后腰'],[65,53,'8','后腰'],[18,31,'11','左边锋'],[50,33,'10','前腰'],[82,31,'7','右边锋'],[50,13,'9','中锋']],
  '433':[[50,89,'1','门将'],[16,71,'2','左后卫'],[38,75,'4','中卫'],[62,75,'5','中卫'],[84,71,'3','右后卫'],[50,56,'6','后腰'],[29,42,'8','中前卫'],[71,42,'10','中前卫'],[18,22,'11','左边锋'],[50,13,'9','中锋'],[82,22,'7','右边锋']]
};
export function cleanText(value,max=24) {return [...String(value ?? '').replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,max).join('');}
export function bound(value,min,max,fallback=min) {return Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;}
export function normalizePortrait(value) {return typeof value==='string' && value.length<=20000 && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';}
export function createBoard(formation='4231') {
  const key=FORMATIONS[formation]?formation:'4231';
  return {formation:key,players:FORMATIONS[key].map(([x,y,number,role])=>({id:'p'+number,x,y,number,role,name:'',portrait:'',note:'',profileId:'',portraitHidden:false})),lines:[]};
}
export function normalizeBoard(value) {
  const base=createBoard(value?.formation);
  if(!value || !Array.isArray(value.players) || value.players.length!==11)return base;
  const ids=new Set(value.players.map(p=>p?.id));
  if(ids.size!==11 || !base.players.every(p=>ids.has(p.id)))return base;
  const players=base.players.map(original=>{
    const p=value.players.find(p=>p.id===original.id),number=String(p.number ?? original.number);
    return {...original,x:bound(p.x,5,95,original.x),y:bound(p.y,7,93,original.y),name:cleanText(p.name,16),portrait:normalizePortrait(p.portrait),profileId:/^[a-z-]{1,40}$/.test(p.profileId || '')?p.profileId:'',portraitHidden:p.portraitHidden===true,note:cleanText(p.note,48),number:/^\d{0,2}$/.test(number)?number:original.number};
  });
  const lines=Array.isArray(value.lines)?value.lines.slice(0,40).filter(l=>l && ['x1','y1','x2','y2'].every(k=>Number.isFinite(l[k]))).map((l,i)=>({id:'line-'+i,x1:bound(l.x1,2,98),y1:bound(l.y1,2,98),x2:bound(l.x2,2,98),y2:bound(l.y2,2,98)})):[];
  return {formation:base.formation,players,lines,...(Array.isArray(value.bench)?{bench:normalizeBench(value.bench)}:{}),...(value.rehearsal?{rehearsal:normalizeRehearsal(value.rehearsal,players)}:{})};
}
export function arrangeBoard(board,formation) {
  const next=createBoard(formation);
  return {...next,...(board.bench?{bench:normalizeBench(board.bench)}:{}),players:next.players.map(p=>({...p,name:board.players.find(v=>v.id===p.id)?.name || '',profileId:board.players.find(v=>v.id===p.id)?.profileId || '',portraitHidden:board.players.find(v=>v.id===p.id)?.portraitHidden===true,portrait:normalizePortrait(board.players.find(v=>v.id===p.id)?.portrait),note:cleanText(board.players.find(v=>v.id===p.id)?.note,48),number:board.players.find(v=>v.id===p.id)?.number ?? p.number}))};
}
export function referenceBoard(roster) {
  const board=createBoard(roster.formation);
  return {...board,players:board.players.map(p=>{const match=roster.players.find(v=>v.slot===p.id);return match?{...p,name:cleanText(match.name,16),number:match.number,profileId:match.id}:p;})};
}
export function fillPlayerProfiles(value,roster) {
  const board=normalizeBoard(value),base=createBoard(board.formation);
  return {...board,players:board.players.map(p=>{
    const blank=!p.name || ['待填写','待写'].includes(p.name);
    const reference=roster.players.find(v=>v.id===p.profileId) || (blank?roster.players.find(v=>v.slot===p.id):roster.players.find(v=>v.name===p.name || v.fullName===p.name));
    if(!reference)return p;
    const unassigned=blank && !p.profileId,original=base.players.find(v=>v.id===p.id);
    return {...p,name:blank?reference.name:p.name,profileId:p.profileId || reference.id,number:unassigned && p.number===original.number?reference.number:p.number};
  })};
}
export function isBlankBoard(value) {
  const b=normalizeBoard(value),base=createBoard(b.formation);
  return !b.bench?.length && !b.lines.length && !b.rehearsal?.steps.length && b.players.every((p,i)=>!p.name && !p.portrait && !p.profileId && !p.note && p.number===base.players[i].number && p.x===base.players[i].x && p.y===base.players[i].y);
}
export function normalizeFan(value) {
  const number=String(value?.number ?? '12');
  return {nickname:cleanText(value?.nickname ?? '南看台的第十二人',16),number:/^\d{1,2}$/.test(number)?number:'12',slogan:cleanText(value?.slogan ?? '每一份热爱，都有自己的主场。',36),skin:value?.skin==='silver'?'silver':'red'};
}
export function normalizeLayout(value={}) {
  const order=Array.isArray(value.railOrder)?value.railOrder:[],valid=DEFAULT_LAYOUT.railOrder;
  const railOrder=[...new Set(order.filter(id=>valid.includes(id)))];
  for(const id of valid)if(!railOrder.includes(id))railOrder.push(id);
  return {panelWidth:Math.round(bound(value.panelWidth,360,520,420)/10)*10,miniPosition:['top-right','top-left','bottom-right'].includes(value.miniPosition)?value.miniPosition:'top-right',railOrder};
}
export function normalizeStudio(value) {
  const saved=Array.isArray(value?.savedBoards)?value.savedBoards.slice(0,8):[];
  return {board:normalizeBoard(value?.board),fan:normalizeFan(value?.fan),savedBoards:saved.filter(s=>s && typeof s.id==='string' && typeof s.title==='string').map((s,i)=>({id:cleanText(s.id,64)||'saved-'+i,title:cleanText(s.title,24)||'我的阵型',board:normalizeBoard(s.board)}))};
}
export function layoutPreset(name) {
  return name==='matchday'?{panelWidth:460,miniPosition:'bottom-right',railOrder:['matches','tactics','focus'],mini:true,railPinned:true}:{panelWidth:380,miniPosition:'top-right',railOrder:['focus','matches','tactics'],mini:false,railPinned:false};
}
export function boardPrompt(board,{positionsOnly=false}={}) {
  const b=normalizeBoard(board),formation=b.formation==='433'?'4-3-3':'4-2-3-1';
  const players=b.players.map(p=>`${p.number}号 ${p.name || p.role}：横向 ${Math.round(p.x)}%，纵向 ${Math.round(p.y)}%${p.note?'；个人备注：'+p.note:''}`).join('\n');
  if(positionsOnly)return `这是我自定义的拜仁球员卡牌阵型（${formation}），不代表真实首发。坐标以球场左上角为原点，进攻方向朝上。\n\n球员站位：\n${players}\n\n请结合球员与具体站位分析阵型，并给出调整建议。涉及真实比赛或近期球员情况，请查询可靠来源并注明时间。`;
  const lines=b.lines.map((l,i)=>`${i+1}. (${Math.round(l.x1)}%,${Math.round(l.y1)}%) → (${Math.round(l.x2)}%,${Math.round(l.y2)}%)`).join('\n') || '暂未绘制';
  const plan=b.rehearsal?compileRehearsal(b):null,sequence=plan?'\n\n连续配合（传球、跑位与带球）：\n'+plan.steps.map((step,i)=>`${i+1}. ${step.label}`).join('\n')+(plan.error?'\n未完成：'+plan.error:''):'';
  return `这是我自定义的拜仁战术板（${formation}），不代表真实首发。坐标以球场左上角为原点，横向向右、纵向向下，进攻方向朝上。\n\n球员站位：\n${players}\n\n我标注的传球路线：\n${lines}${sequence}\n\n请结合这些具体站位和路线，分析接应、空间与攻守转换，并给出可操作的调整建议。涉及当前球员、真实比赛或近期战术时，请查询可靠来源并注明时间，区分事实与推测。`;
}
export function pngFilename(fan) {const name=cleanText(fan.nickname || '我的主场',16).replace(/[<>:"/\\|?*]/g,'_');return `拜仁球迷名片-${name}-${fan.number}.png`;}
// Canvas uses only locally embedded artwork and system fonts; exports require no server.
export function paintFanCard(canvas,fan,crest) {
  const f=normalizeFan(fan),ctx=canvas.getContext('2d');if(!ctx)throw Error('当前窗口不支持图片导出');
  canvas.width=1200;canvas.height=750;ctx.clearRect(0,0,1200,750);
  const silver=f.skin==='silver',ink=silver?'#1d2533':'#ffffff',muted=silver?'#5d6677':'#f8d9df';
  const bg=ctx.createLinearGradient(0,0,1200,750);bg.addColorStop(0,silver?'#ffffff':'#e00b37');bg.addColorStop(1,silver?'#e7ebf2':'#850522');ctx.fillStyle=bg;ctx.fillRect(0,0,1200,750);
  ctx.save();ctx.globalAlpha=silver?.035:.06;ctx.fillStyle=ink;for(let x=-500;x<1500;x+=110){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+150,0);ctx.lineTo(x+850,750);ctx.lineTo(x+700,750);ctx.closePath();ctx.fill();}ctx.restore();
  ctx.save();ctx.globalAlpha=silver?.08:.12;ctx.fillStyle=silver?'#c9062b':'#ffffff';ctx.font='900 480px "Segoe UI",sans-serif';ctx.textAlign='right';ctx.fillText(f.number,1140,535);ctx.restore();
  ctx.fillStyle=silver?'#c9062b':'#ffffff';ctx.fillRect(66,68,5,63);ctx.fillStyle=ink;ctx.textAlign='left';ctx.font='700 22px "Segoe UI",sans-serif';ctx.fillText('BAYERN HOME',93,91);ctx.fillStyle=muted;ctx.font='17px "Segoe UI","Microsoft YaHei",sans-serif';ctx.fillText('MIA SAN MIA  /  球迷名片',93,121);
  if(crest)ctx.drawImage(crest,1024,65,108,108);
  const fit=(text,initial,width,weight=700)=>{let size=initial;do{ctx.font=`${weight} ${size}px "Segoe UI","Microsoft YaHei",sans-serif`;if(ctx.measureText(text).width<=width)break;size-=1;}while(size>16);};
  ctx.fillStyle=muted;ctx.font='18px "Segoe UI","Microsoft YaHei",sans-serif';ctx.fillText('这一份热爱，属于',72,285);
  ctx.fillStyle=ink;fit(f.nickname || '你的名字',64,970);ctx.fillText(f.nickname || '你的名字',68,373);
  ctx.fillStyle=muted;fit(f.slogan || 'MIA SAN MIA.',29,1020,400);ctx.fillText(f.slogan || 'MIA SAN MIA.',72,439);
  ctx.strokeStyle=silver?'#cdd3df':'#ffffff44';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(72,554);ctx.lineTo(1128,554);ctx.stroke();
  ctx.fillStyle=ink;ctx.font='700 34px "Segoe UI",sans-serif';ctx.fillText('NO. '+f.number,72,614);ctx.fillStyle=muted;ctx.font='18px "Segoe UI","Microsoft YaHei",sans-serif';ctx.fillText('我们，就是我们。',72,651);
  ctx.textAlign='right';ctx.font='700 17px "Segoe UI",sans-serif';ctx.fillStyle=ink;ctx.fillText('FAN-MADE · ALWAYS AT HOME',1128,615);ctx.fillStyle=muted;ctx.font='16px "Segoe UI","Microsoft YaHei",sans-serif';ctx.fillText('非官方球迷创作',1128,650);
  ctx.save();ctx.beginPath();ctx.rect(0,705,1200,45);ctx.clip();ctx.fillStyle='#ffffff';ctx.fillRect(0,705,1200,45);ctx.fillStyle='#1764a8';for(let x=-30;x<1200;x+=60){ctx.beginPath();ctx.moveTo(x,727);ctx.lineTo(x+30,705);ctx.lineTo(x+60,727);ctx.lineTo(x+30,750);ctx.closePath();ctx.fill();}ctx.restore();
  return canvas;
}

export const BACKUP_FORMAT = 'dsh-bayern-home-backup';
export function normalizePreferences(value={}) {
  const p=value && typeof value==='object'?value:{};
  const defaults={spoiler:true,quiet:false,matchday:false,mini:true,railPinned:false,railHintSeen:false};
  const flags=Object.fromEntries(Object.entries(defaults).map(([key,fallback])=>[key,typeof p[key]==='boolean'?p[key]:fallback]));
  return {...normalizeLayout(p),...flags,strength:bound(p.strength,20,100,82),zone:p.zone==='Europe/Berlin'?'Europe/Berlin':'Asia/Shanghai',lead:[15,30,60,120].includes(p.lead)?p.lead:30};
}
export function createBackup(value,now=new Date()) {
  return JSON.stringify({format:BACKUP_FORMAT,version:1,createdAt:now.toISOString(),prefs:normalizePreferences(value?.prefs),studio:normalizeStudio(value)},null,2);
}
export function parseBackup(text) {
  if(typeof text!=='string'||text.length>3*1024*1024)throw Error('备份文件过大，请选择 3 MB 以内的主场备份。');
  let value;try{value=JSON.parse(text);}catch{throw Error('无法读取这个文件，请选择导出的 JSON 备份。');}
  if(value?.format!==BACKUP_FORMAT||value.version!==1)throw Error('不是受支持的拜仁主场备份，当前数据未改变。');
  const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const validPlayer=p=>record(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&typeof p.name==='string'&&typeof p.number==='string'&&/^\d{0,2}$/.test(p.number)&&typeof p.portrait==='string'&&(!p.portrait||!!normalizePortrait(p.portrait))&&typeof p.note==='string'&&typeof p.profileId==='string'&&(!p.profileId||/^[a-z-]{1,40}$/.test(p.profileId))&&typeof p.portraitHidden==='boolean';
  const validPlan=p=>p===undefined||(record(p)&&typeof p.holder==='string'&&createBoard().players.some(v=>v.id===p.holder)&&Array.isArray(p.steps)&&p.steps.length<=24&&p.steps.every(v=>record(v)&&['pass','run','carry'].includes(v.kind)&&createBoard().players.some(p=>p.id===v.playerId)&&(v.target===null||record(v.target)&&['x','y'].every(k=>Number.isFinite(v.target[k])))&&(v.support===null||record(v.support)&&createBoard().players.some(p=>p.id===v.support.playerId)&&['x','y'].every(k=>Number.isFinite(v.support[k])))));
  const validBench=rows=>rows===undefined||(Array.isArray(rows)&&rows.length<=MAX_BENCH&&new Set(rows.map(p=>p?.id)).size===rows.length&&rows.every(p=>validPlayer(p)&&validBenchId(p.id)));
  const validBoard=b=>record(b)&&validBench(b.bench)&&validPlan(b.rehearsal)&&Array.isArray(b.players)&&b.players.length===11&&['4231','433'].includes(b.formation)&&b.players.every(validPlayer)&&createBoard(b.formation).players.every(p=>b.players.some(v=>v.id===p.id))&&Array.isArray(b.lines)&&b.lines.length<=40&&b.lines.every(l=>record(l)&&['x1','y1','x2','y2'].every(k=>Number.isFinite(l[k])));
  const data=value.studio,prefs=value.prefs,fan=data?.fan,rows=data?.savedBoards;
  const validPrefs=record(prefs)&&['spoiler','quiet','matchday','mini','railPinned','railHintSeen'].every(k=>typeof prefs[k]==='boolean')&&Number.isFinite(prefs.strength)&&Number.isFinite(prefs.panelWidth)&&['Asia/Shanghai','Europe/Berlin'].includes(prefs.zone)&&[15,30,60,120].includes(prefs.lead)&&['top-right','top-left','bottom-right'].includes(prefs.miniPosition)&&Array.isArray(prefs.railOrder)&&prefs.railOrder.length===3&&new Set(prefs.railOrder).size===3&&prefs.railOrder.every(k=>DEFAULT_LAYOUT.railOrder.includes(k));
  const validFan=record(fan)&&typeof fan.nickname==='string'&&typeof fan.slogan==='string'&&/^\d{1,2}$/.test(fan.number)&&['red','silver'].includes(fan.skin);
  const validSaved=Array.isArray(rows)&&rows.length<=8&&rows.every(row=>record(row)&&typeof row.id==='string'&&!!cleanText(row.id,64)&&typeof row.title==='string'&&!!cleanText(row.title,24)&&validBoard(row.board))&&new Set(rows.map(row=>cleanText(row.id,64))).size===rows.length;
  if(!record(data)||!validBoard(data.board)||!validFan||!validSaved||!validPrefs)throw Error('备份内容不完整或字段无效，当前数据未改变。');
  return {prefs:normalizePreferences(prefs),...normalizeStudio(data),createdAt:typeof value.createdAt==='string'?value.createdAt:''};
}

export function writeLocalRestore(storage,entries) {
  let previous;
  try{previous=entries.map(([key])=>[key,storage.getItem(key)]);}catch{return {ok:false,rollbackFailed:false};}
  const written=[];
  try{for(const [key,value] of entries){storage.setItem(key,value);written.push(key);}return {ok:true,rollbackFailed:false};}
  catch{let rollbackFailed=false;for(const key of written.reverse()){const value=previous.find(([id])=>id===key)[1];try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{rollbackFailed=true;}}return {ok:false,rollbackFailed};}
}

export function addPassRoute(board,from,to,id='line-'+Date.now()) {
  if(board.lines.length>=40)throw Error('最多绘制 40 条路线，请先删除一些。');
  if(![from?.x,from?.y,to?.x,to?.y].every(Number.isFinite))throw Error('路线坐标无效，请重新选择起点与终点。');
  const a={x:bound(from.x,2,98),y:bound(from.y,2,98)},b={x:bound(to.x,2,98),y:bound(to.y,2,98)};
  if(Math.hypot(b.x-a.x,b.y-a.y)<2)throw Error('请选择不同的路线终点。');
  return {...board,lines:[...board.lines,{id:cleanText(id,64),x1:a.x,y1:a.y,x2:b.x,y2:b.y}]};
}

export function compareBoardPositions(value,reference) {
  const current=normalizeBoard(value),baseline=normalizeBoard(reference);
  const players=current.players.map(player=>{
    const before=baseline.players.find(row=>row.id===player.id),dx=player.x-before.x,dy=player.y-before.y;
    return {id:player.id,name:player.name||player.role,number:player.number,before:{x:before.x,y:before.y,number:before.number},after:{x:player.x,y:player.y},dx,dy,moved:Math.hypot(dx,dy)>=.5,identityChanged:player.name!==before.name||player.number!==before.number};
  });
  return {players,movedCount:players.filter(p=>p.moved).length,identityChangedCount:players.filter(p=>p.identityChanged).length,formationChanged:current.formation!==baseline.formation,sequenceChanged:JSON.stringify(current.rehearsal)!==JSON.stringify(baseline.rehearsal),routesChanged:JSON.stringify(current.lines.map(({x1,y1,x2,y2})=>[x1,y1,x2,y2]))!==JSON.stringify(baseline.lines.map(({x1,y1,x2,y2})=>[x1,y1,x2,y2])),beforeRouteCount:baseline.lines.length,afterRouteCount:current.lines.length};
}

// Pure view of normalized routes. Integer positions show completed route endpoints.
export function rehearsalFrame(lines,position=0,atStart=false) {
  if(!Array.isArray(lines)||!lines.length)return null;
  const progress=bound(position,0,lines.length),index=Math.max(0,Math.min(lines.length-1,atStart&&progress<lines.length?Math.floor(progress):Math.ceil(progress)-1)),line=lines[index],fraction=progress-index,previous=lines[index-1];
  return {index,total:lines.length,completed:Math.floor(progress),progress,fraction,x:line.x1+(line.x2-line.x1)*fraction,y:line.y1+(line.y2-line.y1)*fraction,switched:!!previous&&Math.hypot(previous.x2-line.x1,previous.y2-line.y1)>.5};
}

// Plan coordinates are percentages of a 68m x 105m schematic pitch. No opposition/physics prediction.
export function normalizeRehearsal(value,players) {
  const ids=new Set(players.map(p=>p.id)),point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:bound(p.x,5,95),y:bound(p.y,7,93)}:null;
  return {holder:ids.has(value?.holder)?value.holder:players[0].id,steps:(Array.isArray(value?.steps)?value.steps:[]).slice(0,24).filter(v=>v&&['pass','run','carry'].includes(v.kind)&&ids.has(v.playerId)).map(v=>({kind:v.kind,playerId:v.playerId,target:point(v.target),support:ids.has(v.support?.playerId)&&point(v.support)?{playerId:v.support.playerId,...point(v.support)}:null}))};
}
export function compileRehearsal(board) {
  const plan=normalizeRehearsal(board.rehearsal,board.players),positions=Object.fromEntries(board.players.map(p=>[p.id,{x:p.x,y:p.y}])),steps=[];
  let holder=plan.holder,error='';
  const metres=(a,b)=>Math.hypot((a.x-b.x)*.68,(a.y-b.y)*1.05),name=id=>{const p=board.players.find(p=>p.id===id);return p.number+'号 '+(p.name||p.role);};
  for(const [index,action] of plan.steps.entries()) {
    const before=JSON.parse(JSON.stringify(positions)),oldHolder=holder,actor=action.playerId,from={...positions[holder]},target=action.target||positions[actor],moves=[];
    if(action.kind==='pass'&&actor===holder)error='持球人不能传给自己。';
    if(action.kind==='run'&&actor===holder)error='持球人移动请使用「带球推进」。';
    if(action.kind==='carry'&&actor!==holder)error='只有持球人可以带球推进。';
    if(action.kind!=='pass'&&!action.target)error='请为跑位或带球选择落点。';
    if(action.target&&metres(positions[actor],target)<.5&&action.kind!=='pass')error='跑位落点太近，请选择其他位置。';
    if(action.support&&(action.support.playerId===actor||action.kind!=='pass'))error='辅助跑位需要选择另一名球员。';
    if(error){error='第 '+(index+1)+' 步：'+error;break;}
    if(action.target){moves.push({id:actor,from:before[actor],to:{...target}});positions[actor]={...target};}
    if(action.support){const {playerId,x,y}=action.support;moves.push({id:playerId,from:before[playerId],to:{x,y}});positions[playerId]={x,y};}
    const to=action.kind==='pass'?{...positions[actor]}:action.kind==='carry'?{...positions[holder]}:{...from};
    const flight=action.kind==='pass'?Math.max(.28,metres(from,to)/14):0,receiverTime=action.target?metres(before[actor],target)/5.5:0;
    const reception=Math.max(.6,receiverTime,flight+.2),launch=action.kind==='pass'?reception-flight:0;
    for(const m of moves){m.start=action.kind==='pass'&&m.id===oldHolder?launch:0;m.end=m.id===actor&&action.kind==='pass'?reception:m.start+Math.max(.6,metres(m.from,m.to)/5.5);}
    const duration=Math.max(.85,action.kind==='pass'?reception+.25:0,...moves.map(m=>m.end+.25));
    if(action.kind==='pass')holder=actor;
    const verb=action.kind==='pass'?name(oldHolder)+' → '+name(actor)+(action.target?' · 传向跑动接应点':' · 脚下接球'):action.kind==='carry'?name(actor)+' · 带球推进':name(actor)+' · 无球跑位';
    steps.push({action,index,before,after:JSON.parse(JSON.stringify(positions)),holderBefore:oldHolder,holderAfter:holder,from,to,moves,flight,launch,duration,label:verb+(action.support?'；'+name(action.support.playerId)+' 同时跑位':'')});
  }
  return {steps,error,holder,positions,initialHolder:plan.holder};
}
export function possessionFrame(plan,position=0,atStart=false) {
  if(!plan.steps.length)return null;
  const total=plan.steps.length,progress=bound(position,0,total),index=Math.max(0,Math.min(total-1,atStart&&progress<total?Math.floor(progress):Math.ceil(progress)-1)),step=plan.steps[index],fraction=progress-index,time=step.duration*fraction,positions=JSON.parse(JSON.stringify(step.before));
  for(const m of step.moves){const motion=bound((time-m.start)/Math.max(.01,m.end-m.start),0,1),ease=motion*motion*(3-2*motion);positions[m.id]={x:m.from.x+(m.to.x-m.from.x)*ease,y:m.from.y+(m.to.y-m.from.y)*ease};}
  const flight=step.action.kind==='pass'?bound((time-step.launch)/step.flight,0,1):0;
  let ball=step.action.kind==='carry'?positions[step.holderBefore]:step.action.kind==='pass'?{x:step.from.x+(step.to.x-step.from.x)*flight,y:step.from.y+(step.to.y-step.from.y)*flight}:positions[step.holderBefore];
  const holder=step.action.kind==='pass'?(flight<=0?step.holderBefore:flight>=1?step.holderAfter:null):step.holderBefore;
  // Once controlled, the ball follows the receiver's feet through the final settling interval.
  if(holder)ball=positions[holder];
  return {index,total,progress,fraction,positions,x:ball.x,y:ball.y,holder,step,phase:step.action.kind==='pass'?(flight<=0?'观察与接应':flight>=1?'接球控制':'传球途中'):step.action.kind==='carry'?'带球推进':'无球跑位'};
}
export function wallPassPlan(board) {
  const a=board.players.find(p=>p.id==='p6'),b=board.players.find(p=>p.id==='p10')||board.players.find(p=>p.id==='p9');
  const forward={x:bound(a.x,10,90),y:bound(a.y-11,18,85)};
  return {holder:a.id,steps:[{kind:'pass',playerId:b.id,target:null,support:{playerId:a.id,...forward}},{kind:'pass',playerId:a.id,target:{x:forward.x,y:bound(forward.y-14,8,88)},support:null},{kind:'carry',playerId:a.id,target:{x:bound(forward.x-7,10,90),y:bound(forward.y-26,8,88)},support:null}]};
}

export const MAX_BENCH=32;
const validBenchId=id=>/^b(?:[1-9]|[12]\d|3[0-2])$/.test(id);
export function normalizeBench(rows){return (Array.isArray(rows)?rows:[]).filter(p=>p&&validBenchId(p.id)).filter((p,i,a)=>a.findIndex(v=>v.id===p.id)===i).slice(0,MAX_BENCH).map(p=>({id:p.id,x:50,y:50,role:cleanText(p.role,8)||'替补',number:/^\d{0,2}$/.test(String(p.number??''))?String(p.number??''):'',name:cleanText(p.name,16),note:cleanText(p.note,48),portrait:normalizePortrait(p.portrait),profileId:/^[a-z-]{1,40}$/.test(p.profileId||'')?p.profileId:'',portraitHidden:p.portraitHidden===true}));}
export function addBenchPlayer(board){const bench=normalizeBench(board.bench);if(bench.length>=MAX_BENCH)throw Error('替补栏最多保存'+MAX_BENCH+'人。');const id=Array.from({length:MAX_BENCH},(_,i)=>'b'+(i+1)).find(id=>!bench.some(p=>p.id===id));return {...board,bench:normalizeBench([...bench,{id,role:'替补',number:'',name:'',portrait:'',note:'',profileId:'',portraitHidden:false}])};}
// Additive only: preserve field players, customized reserve cards, photos and notes.
export function fillOfficialBench(board,roster,{onlyIfMissing=false}={}){
 if(onlyIfMissing&&Array.isArray(board.bench))return board;
 let next={...board,bench:normalizeBench(board.bench)};
 for(const row of roster.players){
  if([...next.players,...next.bench].some(p=>p.profileId===row.id||p.name===row.name||p.name===row.fullName))continue;
  if(next.bench.length>=MAX_BENCH)break;
  next=addBenchPlayer(next);const id=next.bench.at(-1).id;
  next={...next,bench:normalizeBench(next.bench.map(p=>p.id===id?{...p,role:row.role||'替补',number:row.number,name:row.name,profileId:row.id}:p))};
 }
 return next;
}
export function substitutePlayer(board,benchId,starterId){const reserve=board.bench?.find(p=>p.id===benchId),starter=board.players.find(p=>p.id===starterId);if(!reserve||!starter)throw Error('请选择替补和场上球员。');if(!reserve.name)throw Error('请先填写替补球员名字。');const keys=['number','name','note','portrait','profileId','portraitHidden'],identity=p=>Object.fromEntries(keys.map(k=>[k,p[k]]));return {...board,players:board.players.map(p=>p.id===starterId?{...p,...identity(reserve)}:p),bench:board.bench.map(p=>p.id===benchId?{...p,...identity(starter),role:starter.role}:p)};}
