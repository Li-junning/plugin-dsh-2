import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMatches,utcDate,scoreText,matchState,nextMatch,seasonFor,makeCalendar,dateLabel,isMatchday,promptFor,fetchSeason,readFixtureCache,writeFixtureCache,fixtureGroups,canRevealScore,matchDiscussionPrompt,MATCH_DISCUSSION_ANGLES} from '../src/data.mjs';
const match = (patch={}) => ({matchID:100,team1:{teamId:40,teamName:'FC Bayern München'},team2:{teamId:7,teamName:'Borussia Dortmund'},matchDateTimeUTC:'2026-10-17T16:30:00Z',matchIsFinished:false,matchResults:[],...patch});
test('filters other teams, deduplicates IDs, preserves away fixtures',()=>{const rows=normalizeMatches([match(),match(),match({matchID:101,team1:{teamId:7,teamName:'Dortmund'},team2:{teamId:40,teamName:'Bayern'}}),match({matchID:102,team1:{teamId:9},team2:{teamId:7}})]);assert.deepEqual(rows.map(m=>m.id),[100,101]);});
test('UTC suffix, offsets and missing times are handled without inventing local times',()=>{assert.equal(utcDate('2026-10-17T16:30:00'),'2026-10-17T16:30:00.000Z');assert.equal(utcDate('2026-10-17T18:30:00+02:00'),'2026-10-17T16:30:00.000Z');assert.equal(utcDate('invalid'),null);assert.equal(normalizeMatches([match({matchDateTimeUTC:null})])[0].kickoff,null);});
test('uses final/current resultTypeID 2 instead of array order or halftime',()=>{const rows=normalizeMatches([match({matchResults:[{resultTypeID:2,pointsTeam1:3,pointsTeam2:1},{resultTypeID:1,pointsTeam1:0,pointsTeam2:1}]})]);assert.deepEqual(rows[0].score,[3,1]);assert.equal(normalizeMatches([match({matchResults:[{resultTypeID:1,pointsTeam1:1,pointsTeam2:0}]})])[0].score,null);});
test('hides every score by default and never presents future zeroes as a live score',()=>{const m=normalizeMatches([match({matchResults:[{resultTypeID:2,pointsTeam1:0,pointsTeam2:0}]})])[0];assert.equal(scoreText(m,true,Date.parse('2026-10-18')),'比分已封存');assert.equal(scoreText(m,false,Date.parse('2026-10-16')),'VS');assert.equal(scoreText(m,false,Date.parse('2026-10-18')),'0 : 0');});
test('elapsed kickoff alone never claims a match is live',()=>{const m=normalizeMatches([match()])[0];assert.match(matchState(m,Date.parse('2026-10-18')),/状态待确认/);assert.equal(matchState({...m,finished:true}),'已结束');});
test('next fixture ignores finished and past entries',()=>{const m=normalizeMatches([match()])[0];assert.equal(nextMatch([{...m,finished:true},{...m,kickoff:null},m],Date.parse('2026-10-11')).id,100);assert.equal(nextMatch([m],Date.parse('2026-10-18')),null);});
test('season transitions at July UTC',()=>{assert.equal(seasonFor(new Date('2026-06-30T23:59:59Z')),2025);assert.equal(seasonFor(new Date('2026-07-01T00:00:00Z')),2026);});
test('IANA timezone conversion observes Germany summer/winter times',()=>{assert.match(dateLabel('2026-07-17T16:30:00Z','Europe/Berlin'),/18:30/);assert.match(dateLabel('2026-12-17T16:30:00Z','Europe/Berlin'),/17:30/);assert.match(dateLabel('2026-12-17T16:30:00Z','Asia/Shanghai'),/00:30/);});
test('matchday uses Munich date instead of UTC date',()=>{const m=normalizeMatches([match({matchDateTimeUTC:'2026-10-17T21:30:00Z'})])[0];assert.equal(isMatchday([m],new Date('2026-10-17T22:30:00Z')),false);assert.equal(isMatchday([m],new Date('2026-10-17T19:00:00Z')),true);});
test('calendar has stable UID, correct UTC, alarm, escaping and UTF-8 line folding',()=>{const m=normalizeMatches([match()])[0];m.home='Very long 中文; name, '+('球迷'.repeat(60));const calendar=makeCalendar(m,60,new Date('2026-10-11T00:00:00Z'));assert.match(calendar,/UID:openligadb-100@bayern-home.local/);assert.match(calendar,/DTSTART:20261017T163000Z/);assert.match(calendar,/TRIGGER:-PT60M/);assert.match(calendar,/中文\\; name\\,/);for(const line of calendar.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);assert.throws(()=>makeCalendar({...m,kickoff:null}),/未确认/);});
test('tactics prompt distinguishes general principles and current evidence',()=>{assert.match(promptFor('433'),/4-3-3/);assert.match(promptFor('4231'),/区分事实与推测/);});
test('provider validates response shape and HTTP failure',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async()=>({ok:false,status:503});await assert.rejects(fetchSeason(2026),/503/);globalThis.fetch=async()=>({ok:true,json:async()=>({error:true})});await assert.rejects(fetchSeason(2026),/格式异常/);globalThis.fetch=async()=>({ok:true,json:async()=>[match()]});assert.equal((await fetchSeason(2026)).matches.length,1);}finally{globalThis.fetch=original;}});

test('fixture cache roundtrips safely and never trusts a stored source URL',()=>{
  const now=Date.parse('2026-10-13T00:00:00Z'),matches=normalizeMatches([match()]);
  matches[0].source='https://untrusted.invalid';
  const restored=readFixtureCache(writeFixtureCache(matches,2026,now-1000),2026,now);
  assert.equal(restored.matches[0].id,100);
  assert.equal(restored.matches[0].source,'https://api.openligadb.de/getmatchdata/100');
  assert.equal(restored.updatedAt,now-1000);
});
test('fixture cache rejects corrupted, wrong-season, expired and invalid records',()=>{
  const now=Date.parse('2026-10-13T00:00:00Z'),matches=normalizeMatches([match()]);
  assert.equal(readFixtureCache('{broken',2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache(matches,2025,now),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache(matches,2026,now-31*86400000),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache(matches,2026,now+3600000),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache([{...matches[0],score:[-1,0]}],2026,now),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache([matches[0],matches[0]],2026,now),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache([{...matches[0],homeId:3,awayId:4}],2026,now),2026,now),null);
  assert.equal(readFixtureCache(writeFixtureCache([{...matches[0],kickoff:'nonsense'}],2026,now),2026,now),null);
});
test('month grouping uses the selected timezone and keeps every match',()=>{
  const m=normalizeMatches([match({matchDateTimeUTC:'2026-10-31T20:30:00Z'})])[0];
  assert.match(fixtureGroups([m],'Asia/Shanghai')[0].label,/11/);
  assert.match(fixtureGroups([m],'Europe/Berlin')[0].label,/10/);
  const rows=Array.from({length:34},(_,i)=>({...m,id:i+1}));
  assert.equal(fixtureGroups(rows)[0].matches.length,34);
  assert.equal(fixtureGroups([{...m,kickoff:null}])[0].label,'时间待定');
});
test('single-score reveal is eligible only for finished or elapsed fixtures',()=>{
  const m=normalizeMatches([match()])[0],now=Date.parse('2026-10-13');
  assert.equal(canRevealScore(m,now),false);
  assert.equal(canRevealScore({...m,kickoff:null},now),false);
  assert.equal(canRevealScore({...m,finished:true},now),true);
  assert.equal(canRevealScore(m,Date.parse('2026-10-18')),true);
});

test('match discussion uses fixture context, viewing angle and explicit evidence limits without leaking scores',()=>{
 const m=normalizeMatches([match({matchResults:[{resultTypeID:2,pointsTeam1:9,pointsTeam2:8}]})])[0],before=JSON.stringify(m);
 for(const [angle,,detail] of MATCH_DISCUSSION_ANGLES){const text=matchDiscussionPrompt(m,angle);assert.ok(text.includes(detail));assert.match(text,/拜仁慕尼黑 vs 多特蒙德/);assert.match(text,/北京时间/);assert.match(text,/待核实/);assert.match(text,/区分事实与推测/);assert.match(text,/不透露/);assert.ok(!text.includes('9 : 8'));}
 assert.equal(JSON.stringify(m),before);assert.match(matchDiscussionPrompt(m,'defense','Europe/Berlin'),/慕尼黑时间/);
});
test('match discussion handles absent fixtures and unknown viewing angles without inventing opponents',()=>{
 const text=matchDiscussionPrompt(null,'unknown');assert.match(text,/先核实拜仁下一场/);assert.ok(text.includes(MATCH_DISCUSSION_ANGLES[0][2]));assert.match(text,/不编造首发/);
});

test('three competitions merge chronologically, filter other teams and retain unknown kickoff times',async()=>{
 const original=globalThis.fetch,urls=[];
 try {
  globalThis.fetch=async url=>{urls.push(url);const code=url.split('/').at(-2),id={bl1:1,ucl:2,dfb:3}[code];return {ok:true,json:async()=>[match({matchID:id,matchDateTimeUTC:code==='dfb'?null:code==='ucl'?'2026-10-14T19:00:00Z':'2026-10-17T16:30:00Z'}),match({matchID:88,team1:{teamId:4},team2:{teamId:9}})]};};
  const result=await fetchSeason(2026);
  assert.deepEqual(result.matches.map(m=>m.competition),['ucl','bl1','dfb']);assert.equal(result.matches[2].kickoff,null);
  assert.equal(nextMatch(result.matches,Date.parse('2026-10-13')).id,2);assert.equal(urls.length,3);assert.ok(urls.every(u=>u.endsWith('/2026')));
  assert.deepEqual(result.coverage.map(c=>c.status),['ready','ready','ready']);
 } finally {globalThis.fetch=original;}
});

test('partial failure keeps fresh results and only valid cached fixtures for the failed competition',async()=>{
 const original=globalThis.fetch,now=Date.now(),old=normalizeMatches([match({matchID:9})],'ucl');
 try {
  globalThis.fetch=async url=>{if(url.includes('/ucl/'))throw Error('offline');return {ok:true,json:async()=>[match({matchID:url.includes('/dfb/')?3:1})]};};
  const previous={matches:old,coverage:[{competition:'ucl',status:'ready',updatedAt:now-10000}]},result=await fetchSeason(2026,undefined,previous);
  assert.equal(result.matches.length,3);assert.equal(result.coverage[1].status,'error');assert.equal(result.coverage[1].updatedAt,now-10000);
  const stale=await fetchSeason(2026,undefined,{...previous,coverage:[{...previous.coverage[0],updatedAt:now-31*86400000}]});
  assert.equal(stale.matches.length,2);assert.equal(stale.coverage[1].updatedAt,null);
  globalThis.fetch=async()=>({ok:true,json:async()=>[]});const empty=await fetchSeason(2026,undefined,previous);assert.equal(empty.matches.length,0);assert.ok(empty.coverage.every(c=>c.status==='empty'));
 }finally{globalThis.fetch=original;}
});

test('a timed out competition does not discard successful competitions',async()=>{
 const original=globalThis.fetch,controller=new AbortController();
 try {
  globalThis.fetch=async url=>{if(url.includes('/ucl/')){controller.abort();throw new DOMException('timeout','AbortError');}return {ok:true,json:async()=>[match({matchID:url.includes('/dfb/')?3:1})]};};
  const result=await fetchSeason(2026,controller.signal);assert.equal(result.matches.length,2);assert.equal(result.coverage[1].status,'error');
  globalThis.fetch=async()=>{throw new DOMException('timeout','AbortError');};await assert.rejects(fetchSeason(2026,controller.signal),{name:'AbortError'});
 }finally{globalThis.fetch=original;}
});

test('cup scores use extra time and penalties before regulation and remain sealed by default',()=>{
 const results=[{resultTypeID:2,pointsTeam1:1,pointsTeam2:1},{resultTypeID:4,resultTypeKind:'AfterExtraTime',pointsTeam1:2,pointsTeam2:2},{resultTypeID:5,resultTypeKind:'AfterPenalties',pointsTeam1:5,pointsTeam2:4}];
 const m=normalizeMatches([match({matchIsFinished:true,matchResults:results})],'dfb')[0];
 assert.equal(scoreText(m,true),'比分已封存');assert.equal(scoreText(m,false,Date.parse('2026-10-18')),'5 : 4（点球后）');
 const extra=normalizeMatches([match({matchResults:results.slice(0,2)})],'ucl')[0];assert.equal(scoreText(extra,false,Date.parse('2026-10-18')),'2 : 2（加时后）');
});

test('cup calendar and discussion carry the competition without changing stable UIDs',()=>{
 const m=normalizeMatches([match()],'ucl')[0],calendar=makeCalendar(m,30,new Date('2026-10-11'));
 assert.match(calendar,/SUMMARY:欧冠 · /);assert.match(calendar,/DESCRIPTION:欧冠/);assert.match(calendar,/UID:openligadb-100@/);assert.match(matchDiscussionPrompt(m),/欧冠/);
});

test('legacy cache migrates to Bundesliga and new cache preserves competition and result stages',()=>{
 const now=Date.now(),bl=normalizeMatches([match()])[0],cup=normalizeMatches([match({matchID:101})],'dfb')[0];cup.score=[5,4];cup.scoreNote='点球后';
 const old=readFixtureCache(JSON.stringify({version:1,season:2026,updatedAt:now,matches:[bl]}),2026,now);
 assert.equal(old.matches[0].competition,'bl1');assert.equal(old.coverage.length,1);
 const restored=readFixtureCache(writeFixtureCache([bl,cup],2026,now),2026,now);assert.equal(restored.matches[1].competition,'dfb');assert.equal(restored.matches[1].scoreNote,'点球后');
 const raw=JSON.parse(writeFixtureCache([bl,cup],2026,now));raw.coverage.find(c=>c.competition==='dfb').updatedAt=now-31*86400000;
 const expired=readFixtureCache(JSON.stringify(raw),2026,now);assert.equal(expired.matches.length,1);assert.equal(expired.coverage[1].status,'error');
 raw.matches[0].competition='fake';assert.equal(readFixtureCache(JSON.stringify(raw),2026,now),null);
});
