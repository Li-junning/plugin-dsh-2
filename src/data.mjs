export const TEAM_ID = 40;
export const API_BASE = 'https://api.openligadb.de';
export function seasonFor(date = new Date()) {
  return date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}
export function utcDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const parsed = new Date(/[zZ]$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
export function normalizeMatches(rows) {
  if (!Array.isArray(rows)) throw new Error('数据源返回格式异常');
  const seen = new Set();
  return rows.filter(m => m && (m.team1?.teamId === TEAM_ID || m.team2?.teamId === TEAM_ID))
    .filter(m => Number.isInteger(m.matchID) && !seen.has(m.matchID) && seen.add(m.matchID))
    .map(m => {
      const score = Array.isArray(m.matchResults) ? m.matchResults.find(r => r.resultTypeID === 2) : null;
      const validScore = score && Number.isInteger(score.pointsTeam1) && score.pointsTeam1 >= 0 && Number.isInteger(score.pointsTeam2) && score.pointsTeam2 >= 0;
      return {id:m.matchID, kickoff:utcDate(m.matchDateTimeUTC), home:String(m.team1.teamName || '主队'), away:String(m.team2.teamName || '客队'), homeId:m.team1.teamId, awayId:m.team2.teamId,
        finished:m.matchIsFinished === true, score:validScore ? [score.pointsTeam1,score.pointsTeam2] : null, round:String(m.group?.groupName || '德甲'),
        changed:String(m.lastUpdateDateTime || ''), source:`${API_BASE}/getmatchdata/${m.matchID}`};
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
  return m.score ? m.score.join(' : ') : '比分待更新';
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
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Bayern Home//DSH Fan Plugin//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:openligadb-${match.id}@bayern-home.local`,`DTSTAMP:${icsTime(now.toISOString())}`,`DTSTART:${icsTime(start.toISOString())}`,`DTEND:${icsTime(end.toISOString())}`,`SUMMARY:${icsEscape(shortTeam(match.home) + ' vs ' + shortTeam(match.away))}`,`DESCRIPTION:${icsEscape('德甲；开球时间以官方为准。离线导入后不会自动同步改期。来源：' + match.source)}`,'BEGIN:VALARM',`TRIGGER:-PT${lead}M`,'ACTION:DISPLAY','DESCRIPTION:拜仁比赛即将开球','END:VALARM','END:VEVENT','END:VCALENDAR'];
  const encoder = new TextEncoder();
  return lines.map(line => { let parts = [], part = '', bytes = 0; for (const char of line) { const size = encoder.encode(char).length; if (bytes + size > 75) { parts.push(part); part = ' '; bytes = 1; } part += char; bytes += size; } parts.push(part); return parts.join('\r\n'); }).join('\r\n') + '\r\n';
}
export function promptFor(formation) {
  const names = {'4231':'4-2-3-1','433':'4-3-3'};
  return `请用中文解释 ${names[formation] || names['4231']} 的拜仁观赛要点：高位压迫、边路推进和攻防转换。先解释通用阵型原理；涉及当前球员、近期比赛或首发时，请查询可靠来源并注明时间，区分事实与推测。`;
}
export async function fetchSeason(season, signal) {
  if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error('赛季无效');
  const response = await fetch(`${API_BASE}/getmatchdata/bl1/${season}`,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`赛程服务暂不可用（${response.status}）`);
  return normalizeMatches(await response.json());
}

// Only public fixture data is cached; never conversation content or credentials.
export const CACHE_PREFIX = 'dsh-bayern-home:fixtures:v1:';
export function readFixtureCache(raw, season, now = Date.now()) {
  try {
    if (typeof raw !== 'string' || raw.length > 350000) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || value.season !== season || !Number.isFinite(value.updatedAt) || value.updatedAt <= 0 || value.updatedAt > now + 300000 || now - value.updatedAt > 30 * 86400000 || !Array.isArray(value.matches) || value.matches.length > 80) return null;
    const ids = new Set();
    const matches = value.matches.map(m => {
      if (!m || !Number.isInteger(m.id) || m.id <= 0 || ids.has(m.id) || !Number.isInteger(m.homeId) || !Number.isInteger(m.awayId) || (m.homeId !== TEAM_ID && m.awayId !== TEAM_ID) || typeof m.finished !== 'boolean') throw Error('Invalid fixture');
      ids.add(m.id);
      for (const field of ['home','away','round']) if (typeof m[field] !== 'string' || m[field].length > 160) throw Error('Invalid text');
      if (m.kickoff !== null && (!utcDate(m.kickoff) || utcDate(m.kickoff) !== m.kickoff)) throw Error('Invalid kickoff');
      if (m.score !== null && (!Array.isArray(m.score) || m.score.length !== 2 || !m.score.every(n => Number.isInteger(n) && n >= 0 && n <= 99))) throw Error('Invalid score');
      return {id:m.id,kickoff:m.kickoff,home:m.home,away:m.away,homeId:m.homeId,awayId:m.awayId,finished:m.finished,score:m.score,round:m.round,changed:'',source:`${API_BASE}/getmatchdata/${m.id}`};
    });
    return {matches:matches.sort((a,b)=>(a.kickoff || '9999').localeCompare(b.kickoff || '9999')),updatedAt:value.updatedAt};
  } catch {return null;}
}
export function writeFixtureCache(matches, season, updatedAt = Date.now()) {
  return JSON.stringify({version:1,season,updatedAt,matches});
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
