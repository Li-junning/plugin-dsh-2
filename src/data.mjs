export const TEAM_ID = 40;
export const API_BASE = 'https://api.openligadb.de';
export const COMPETITIONS = [{id:'bl1',label:'德甲'},{id:'ucl',label:'欧冠'},{id:'dfb',label:'德国杯'}];
export const competitionLabel = id => COMPETITIONS.find(c=>c.id===id)?.label || '德甲';
const sortMatches = matches => matches.sort((a,b)=>(a.kickoff || '9999').localeCompare(b.kickoff || '9999') || a.id-b.id);
const CACHE_AGE = 30 * 86400000;
export function seasonFor(date = new Date()) {
  return date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}
export function utcDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const parsed = new Date(/[zZ]$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
export function normalizeMatches(rows, competition = 'bl1') {
  if (!Array.isArray(rows)) throw new Error('数据源返回格式异常');
  if (!COMPETITIONS.some(c=>c.id===competition)) throw new Error('赛事无效');
  const seen = new Set();
  return rows.filter(m => m && (m.team1?.teamId === TEAM_ID || m.team2?.teamId === TEAM_ID))
    .filter(m => Number.isInteger(m.matchID) && !seen.has(m.matchID) && seen.add(m.matchID))
    .map(m => {
      const results = Array.isArray(m.matchResults) ? m.matchResults : [];
      const score = results.find(r=>r.resultTypeKind==='AfterPenalties' || r.resultTypeID===5) || results.find(r=>r.resultTypeKind==='AfterExtraTime' || r.resultTypeID===4) || results.find(r=>r.resultTypeKind==='After90Minutes' || r.resultTypeID===2);
      const scoreNote = score && (score.resultTypeKind==='AfterPenalties' || score.resultTypeID===5) ? '点球后' : score && (score.resultTypeKind==='AfterExtraTime' || score.resultTypeID===4) ? '加时后' : '';
      const validScore = score && Number.isInteger(score.pointsTeam1) && score.pointsTeam1 >= 0 && Number.isInteger(score.pointsTeam2) && score.pointsTeam2 >= 0;
      return {id:m.matchID, kickoff:utcDate(m.matchDateTimeUTC), home:String(m.team1.teamName || '主队'), away:String(m.team2.teamName || '客队'), homeId:m.team1.teamId, awayId:m.team2.teamId,
        finished:m.matchIsFinished === true, score:validScore ? [score.pointsTeam1,score.pointsTeam2] : null, round:String(m.group?.groupName || '德甲'),
        competition, scoreNote:validScore ? scoreNote : '', changed:String(m.lastUpdateDateTime || ''), source:`${API_BASE}/getmatchdata/${m.matchID}`};
    }).sort((a,b) => (a.kickoff || '9999').localeCompare(b.kickoff || '9999'));
}
export function matchState(m, now = Date.now()) {
  if (m.finished) return '已结束';
  if (!m.kickoff) return '开球时间待定';
  if (Date.parse(m.kickoff) <= now) return '已到开球时间 · 状态待确认';
  return '未开赛';
}
export function scoreText(m, hidden = true, now = Date.now()) {
  if (hidden) return '比分已封存';
  if (!m.kickoff || Date.parse(m.kickoff) > now) return 'VS';
  return m.score ? m.score.join(' : ') + (m.scoreNote ? '（'+m.scoreNote+'）' : '') : '比分待更新';
}
export function shortTeam(name) {
  const known = {'FC Bayern München':'拜仁慕尼黑','Bayern München':'拜仁慕尼黑','Borussia Dortmund':'多特蒙德','Bayer 04 Leverkusen':'勒沃库森','Bayer Leverkusen':'勒沃库森','RB Leipzig':'莱比锡','Eintracht Frankfurt':'法兰克福','VfB Stuttgart':'斯图加特','SC Freiburg':'弗赖堡','VfL Wolfsburg':'沃尔夫斯堡','1. FC Union Berlin':'柏林联合','Borussia Mönchengladbach':'门兴格拉德巴赫','1. FSV Mainz 05':'美因茨','FC Augsburg':'奥格斯堡','SV Werder Bremen':'云达不莱梅','TSG Hoffenheim':'霍芬海姆','Hamburger SV':'汉堡','1. FC Köln':'科隆','FC St. Pauli':'圣保利','1. FC Heidenheim 1846':'海登海姆'};
  return known[name] || name;
}
export function dateLabel(iso, zone = 'Asia/Shanghai') {
  return iso ? new Intl.DateTimeFormat('zh-CN',{timeZone:zone,month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso)) : '开球时间待定';
}
export function nextMatch(matches, now = Date.now()) {
  return matches.find(m => !m.finished && m.kickoff && Date.parse(m.kickoff) > now) || null;
}
export function countdown(iso, now = Date.now()) {
  if (!iso) return '等待赛程';
  const ms = Date.parse(iso) - now;
  if (ms <= 0) return '已到开球时间';
  const minutes = Math.floor(ms / 60000), days = Math.floor(minutes / 1440), hours = Math.floor(minutes / 60) % 24;
  return days > 0 ? `${days} 天 ${hours} 小时` : hours > 0 ? `${hours} 小时 ${minutes % 60} 分` : `${minutes} 分钟`;
}
export function isMatchday(matches, now = new Date()) {
  const day = d => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  return matches.some(m => !m.finished && m.kickoff && day(new Date(m.kickoff)) === day(now));
}
function icsEscape(value) { return String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }
function icsTime(iso) { return new Date(iso).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'); }
export function makeCalendar(match, lead = 30, now = new Date()) {
  if (!match || !match.kickoff || !Number.isFinite(Date.parse(match.kickoff))) throw new Error('开球时间未确认，暂不能导出日历');
  if (![15,30,60,120].includes(lead)) throw new Error('提醒时间无效');
  const start = new Date(match.kickoff), end = new Date(start.getTime() + 2 * 3600000);
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bayern Home//DSH Fan Plugin//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:openligadb-${match.id}@bayern-home.local`,`DTSTAMP:${icsTime(now.toISOString())}`,`DTSTART:${icsTime(start.toISOString())}`,`DTEND:${icsTime(end.toISOString())}`,`SUMMARY:${icsEscape(competitionLabel(match.competition) + ' · ' + shortTeam(match.home) + ' vs ' + shortTeam(match.away))}`,`DESCRIPTION:${icsEscape(competitionLabel(match.competition)+'；开球时间以官方为准。离线导入后不会自动同步改期。来源：' + match.source)}`,'BEGIN:VALARM',`TRIGGER:-PT${lead}M`,'ACTION:DISPLAY','DESCRIPTION:拜仁比赛即将开球','END:VALARM','END:VEVENT','END:VCALENDAR'];
  const encoder = new TextEncoder();
  return lines.map(line => { let parts = [], part = '', bytes = 0; for (const char of line) { const size = encoder.encode(char).length; if (bytes + size > 75) { parts.push(part); part = ' '; bytes = 1; } part += char; bytes += size; } parts.push(part); return parts.join('\r\n'); }).join('\r\n') + '\r\n';
}
export function promptFor(formation) {
  const names = {'4231':'4-2-3-1','433':'4-3-3'};
  return `请用中文解释 ${names[formation] || names['4231']} 的拜仁观赛要点：高位压迫、边路推进和攻防转换。先解释通用阵型原理；涉及当前球员、近期比赛或首发时，请查询可靠来源并注明时间，区分事实与推测。`;
}
export async function fetchSeason(season, signal, previous = {}) {
  if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error('赛季无效');
  const results = await Promise.allSettled(COMPETITIONS.map(async c=>{
    const response = await fetch(`${API_BASE}/getmatchdata/${c.id}/${season}`,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error(`赛程服务暂不可用（${response.status}）`);
    return normalizeMatches(await response.json(),c.id);
  }));
  if (results.every(r=>r.status==='rejected')) {
    if (signal?.aborted) throw new DOMException('赛程读取已取消','AbortError');
    throw new Error(results.map((r,i)=>competitionLabel(COMPETITIONS[i].id)+'：'+r.reason.message).join('；'));
  }
  const now=Date.now(),matches=[],coverage=[];
  results.forEach((r,i)=>{
    const competition=COMPETITIONS[i].id;
    if(r.status==='fulfilled') {
      matches.push(...r.value);coverage.push({competition,status:r.value.length?'ready':'empty',updatedAt:now});
    } else {
      const old=previous.coverage?.find(c=>c.competition===competition),usable=old?.updatedAt>0 && old.updatedAt<=now && now-old.updatedAt<=CACHE_AGE;
      if(usable)matches.push(...(previous.matches || []).filter(m=>m.competition===competition));
      coverage.push({competition,status:'error',updatedAt:usable?old.updatedAt:null});
    }
  });
  const seen=new Set();
  return {matches:sortMatches(matches.filter(m=>!seen.has(m.id) && seen.add(m.id))),coverage};
}

// Only public fixture data is cached; never conversation content or credentials.
export const CACHE_PREFIX = 'dsh-bayern-home:fixtures:v1:';
export function readFixtureCache(raw, season, now = Date.now()) {
  try {
    if (typeof raw !== 'string' || raw.length > 350000) return null;
    const value = JSON.parse(raw);
    if (![1,2].includes(value.version) || value.season !== season || !Number.isFinite(value.updatedAt) || value.updatedAt <= 0 || value.updatedAt > now + 300000 || now - value.updatedAt > CACHE_AGE || !Array.isArray(value.matches) || value.matches.length > 100) return null;
    const coverage=value.version===1 ? [{competition:'bl1',status:'ready',updatedAt:value.updatedAt}] : value.coverage;
    if(!Array.isArray(coverage) || coverage.length>3 || new Set(coverage.map(c=>c.competition)).size!==coverage.length) return null;
    for(const c of coverage)if(!COMPETITIONS.some(v=>v.id===c.competition) || !['ready','empty','error'].includes(c.status) || !(c.updatedAt===null && c.status==='error') && (!Number.isFinite(c.updatedAt) || c.updatedAt<=0 || c.updatedAt>now+300000))return null;
    const ids = new Set();
    const matches = value.matches.map(m => {
      if (!m || !Number.isInteger(m.id) || m.id <= 0 || ids.has(m.id) || !Number.isInteger(m.homeId) || !Number.isInteger(m.awayId) || (m.homeId !== TEAM_ID && m.awayId !== TEAM_ID) || typeof m.finished !== 'boolean') throw Error('Invalid fixture');
      ids.add(m.id);
      for (const field of ['home','away','round']) if (typeof m[field] !== 'string' || m[field].length > 160) throw Error('Invalid text');
      if (m.kickoff !== null && (!utcDate(m.kickoff) || utcDate(m.kickoff) !== m.kickoff)) throw Error('Invalid kickoff');
      if (m.score !== null && (!Array.isArray(m.score) || m.score.length !== 2 || !m.score.every(n => Number.isInteger(n) && n >= 0 && n <= 99))) throw Error('Invalid score');
      const competition=value.version===1?'bl1':m.competition;
      if(!COMPETITIONS.some(c=>c.id===competition) || !coverage.some(c=>c.competition===competition && c.updatedAt))throw Error('Invalid competition');
      if(m.scoreNote!==undefined && !['','加时后','点球后'].includes(m.scoreNote))throw Error('Invalid result');
      return {id:m.id,kickoff:m.kickoff,home:m.home,away:m.away,homeId:m.homeId,awayId:m.awayId,finished:m.finished,score:m.score,scoreNote:m.scoreNote || '',competition,round:m.round,changed:'',source:`${API_BASE}/getmatchdata/${m.id}`};
    }).filter(m=>now-coverage.find(c=>c.competition===m.competition).updatedAt<=CACHE_AGE);
    return {matches:sortMatches(matches),coverage:coverage.map(c=>now-c.updatedAt>CACHE_AGE?{...c,status:'error',updatedAt:null}:c),updatedAt:value.updatedAt};
  } catch {return null;}
}
export function writeFixtureCache(matches, season, updatedAt = Date.now(), coverage = COMPETITIONS.filter(c=>matches.some(m=>(m.competition || 'bl1')===c.id)).map(c=>({competition:c.id,status:'ready',updatedAt}))) {
  return JSON.stringify({version:2,season,updatedAt,matches,coverage});
}
export function fixtureGroups(matches, zone = 'Asia/Shanghai') {
  const groups = new Map();
  for (const match of matches) {
    const label = match.kickoff ? new Intl.DateTimeFormat('zh-CN',{timeZone:zone,year:'numeric',month:'long'}).format(new Date(match.kickoff)) : '时间待定';
    if (!groups.has(label)) groups.set(label,[]);
    groups.get(label).push(match);
  }
  return [...groups].map(([label,matches])=>({label,matches}));
}
export function canRevealScore(match, now = Date.now()) {
  return match.finished || !!(match.kickoff && Date.parse(match.kickoff) <= now);
}

export const MATCH_DISCUSSION_ANGLES = [
  ['attack','进攻怎么打','重点解释拜仁在边路推进、肋部配合和禁区终结时，观众可以观察哪些信号。'],
  ['defense','防守看哪里','重点解释高位压迫、身后保护和丢球后转换时，观众可以观察哪些信号。'],
  ['players','球员观察清单','给出按位置划分的球员观察清单；只有核实最新名单后再提具体球员，不预设首发。']
];
export function matchDiscussionPrompt(match, angle='attack', zone='Asia/Shanghai') {
  const selected=MATCH_DISCUSSION_ANGLES.find(item=>item[0]===angle)||MATCH_DISCUSSION_ANGLES[0];
  const kickoff=match?.kickoff ? new Intl.DateTimeFormat('zh-CN',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(match.kickoff)) : '开球时间待定';
  const context=match ? `本机赛程线索（可能过期，待核实）：${competitionLabel(match.competition)}；${shortTeam(match.home)} vs ${shortTeam(match.away)}；${kickoff}（${zone==='Europe/Berlin'?'慕尼黑时间':'北京时间'}）。` : '本机尚无下一场已确认时间的比赛，请先核实拜仁下一场德甲、欧冠或德国杯的对手与开球时间。';
  return `请帮我准备一份简短的拜仁赛前观赛指南。${context}
${selected[2]}
先核实最新官方赛程、名单与伤停，注明来源和日期；查不到就明确说明，不编造首发或实时消息。区分事实与推测，不透露已结束比赛的比分或赛果。最后给我三个适合边看边聊的问题。`;
}
