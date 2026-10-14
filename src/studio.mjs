export const STUDIO_STORAGE = 'dsh-bayern-home:studio:v1';
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
    return {...original,x:bound(p.x,5,95,original.x),y:bound(p.y,7,93,original.y),name:cleanText(p.name,16),portrait:normalizePortrait(p.portrait),profileId:/^[a-z-]{1,40}$/.test(p.profileId || '')?p.profileId:'',portraitHidden:p.portraitHidden===true,note:cleanText(p.note,48),number:/^\d{1,2}$/.test(number)?number:original.number};
  });
  const lines=Array.isArray(value.lines)?value.lines.slice(0,40).filter(l=>l && ['x1','y1','x2','y2'].every(k=>Number.isFinite(l[k]))).map((l,i)=>({id:'line-'+i,x1:bound(l.x1,2,98),y1:bound(l.y1,2,98),x2:bound(l.x2,2,98),y2:bound(l.y2,2,98)})):[];
  return {formation:base.formation,players,lines};
}
export function arrangeBoard(board,formation) {
  const next=createBoard(formation);
  return {...next,players:next.players.map(p=>({...p,name:board.players.find(v=>v.id===p.id)?.name || '',profileId:board.players.find(v=>v.id===p.id)?.profileId || '',portraitHidden:board.players.find(v=>v.id===p.id)?.portraitHidden===true,portrait:normalizePortrait(board.players.find(v=>v.id===p.id)?.portrait),note:cleanText(board.players.find(v=>v.id===p.id)?.note,48),number:board.players.find(v=>v.id===p.id)?.number || p.number}))};
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
  return !b.lines.length && b.players.every((p,i)=>!p.name && !p.portrait && !p.profileId && !p.note && p.number===base.players[i].number && p.x===base.players[i].x && p.y===base.players[i].y);
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
export function boardPrompt(board) {
  const b=normalizeBoard(board),formation=b.formation==='433'?'4-3-3':'4-2-3-1';
  const players=b.players.map(p=>`${p.number}号 ${p.name || p.role}：横向 ${Math.round(p.x)}%，纵向 ${Math.round(p.y)}%${p.note?'；个人备注：'+p.note:''}`).join('\n');
  const lines=b.lines.map((l,i)=>`${i+1}. (${Math.round(l.x1)}%,${Math.round(l.y1)}%) → (${Math.round(l.x2)}%,${Math.round(l.y2)}%)`).join('\n') || '暂未绘制';
  return `这是我自定义的拜仁战术板（${formation}），不代表真实首发。坐标以球场左上角为原点，横向向右、纵向向下，进攻方向朝上。\n\n球员站位：\n${players}\n\n我标注的传球路线：\n${lines}\n\n请结合这些具体站位和路线，分析接应、空间与攻守转换，并给出可操作的调整建议。涉及当前球员、真实比赛或近期战术时，请查询可靠来源并注明时间，区分事实与推测。`;
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
