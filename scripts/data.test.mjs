import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMatches,utcDate,scoreText,matchState,nextMatch,seasonFor,makeCalendar,dateLabel,isMatchday,promptFor,fetchSeason,readFixtureCache,writeFixtureCache,fixtureGroups,canRevealScore} from '../src/data.mjs';
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
test('provider validates response shape and HTTP failure',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async()=>({ok:false,status:503});await assert.rejects(fetchSeason(2026),/503/);globalThis.fetch=async()=>({ok:true,json:async()=>({error:true})});await assert.rejects(fetchSeason(2026),/格式异常/);globalThis.fetch=async()=>({ok:true,json:async()=>[match()]});assert.equal((await fetchSeason(2026)).length,1);}finally{globalThis.fetch=original;}});

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
