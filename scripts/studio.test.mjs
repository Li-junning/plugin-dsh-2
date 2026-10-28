import {rehearsalFrame} from '../src/studio.mjs';
import {boardPngFilename,paintBoardSnapshot} from '../src/board-export.mjs';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createBoard,normalizeBoard,arrangeBoard,normalizeFan,normalizeStudio,normalizeLayout,layoutPreset,boardPrompt,pngFilename,normalizePortrait,referenceBoard,isBlankBoard,fillPlayerProfiles} from '../src/studio.mjs';
test('eleven stable player identities survive changing formation and keep assigned names',()=>{
 const b=createBoard();assert.equal(b.players.length,11);b.players.find(p=>p.id==='p9').name='我的前锋';
 const next=arrangeBoard(b,'433');assert.equal(next.formation,'433');assert.equal(next.players.find(p=>p.id==='p9').name,'我的前锋');assert.equal(new Set(next.players.map(p=>p.id)).size,11);
});
test('board validation bounds positions and rejects broken player sets without executing stored fields',()=>{
 const b=createBoard();b.players[0].x=-200;b.players[0].y=300;b.lines=[{id:'a',x1:-5,y1:5,x2:500,y2:40},{x1:'bad',y1:2,x2:4,y2:5}];
 const safe=normalizeBoard(b);assert.equal(safe.players[0].x,5);assert.equal(safe.players[0].y,93);assert.equal(safe.lines.length,1);assert.equal(safe.lines[0].x2,98);
 assert.deepEqual(normalizeBoard({...b,players:b.players.slice(1)}),createBoard());
 assert.equal(normalizeBoard({...b,lines:Array(100).fill({x1:10,y1:10,x2:20,y2:20})}).lines.length,40);
});
test('local studio persists only the bounded feature model, not arbitrary application state',()=>{
 const input={board:createBoard(),fan:{nickname:'南看台',number:'25'},savedBoards:[{id:'one',title:'阵型',board:createBoard('433')}],conversation:'private',token:'private'};
 const restored=normalizeStudio(JSON.parse(JSON.stringify(input)));assert.equal(restored.fan.nickname,'南看台');assert.equal(restored.savedBoards[0].board.formation,'433');assert.equal('conversation' in restored,false);assert.equal('token' in restored,false);
 assert.equal(normalizeStudio({savedBoards:Array(20).fill(input.savedBoards[0])}).savedBoards.length,8);
});
test('fan fields support Unicode, bounded slogans and safe exported file names',()=>{
 const fan=normalizeFan({nickname:'<球迷>\\名字',number:'25',slogan:'热爱'.repeat(40),skin:'silver'});
 assert.equal([...fan.slogan].length,36);assert.equal(fan.skin,'silver');assert.equal(/[<>\\]/.test(pngFilename(fan)),false);assert.equal(normalizeFan({number:'oops'}).number,'12');assert.equal(normalizeFan({nickname:'A\nB'}).nickname,'AB');
});
test('layout order is always a complete permutation and sizes/positions are safe',()=>{
 const layout=normalizeLayout({railOrder:['focus','focus','bad'],panelWidth:999,miniPosition:'outside'});assert.deepEqual(layout.railOrder,['focus','matches','tactics']);assert.equal(layout.panelWidth,520);assert.equal(layout.miniPosition,'top-right');assert.equal(normalizeLayout({panelWidth:-2}).panelWidth,360);
 assert.equal(layoutPreset('simple').mini,false);assert.equal(layoutPreset('matchday').railPinned,true);
});
test('discussion includes the actual custom names, coordinates and routes without claiming an actual lineup',()=>{
 const b=createBoard('433');b.players[0].name='我的门将';b.players[0].x=42;b.lines=[{x1:42,y1:89,x2:50,y2:56}];
 const prompt=boardPrompt(b);assert.match(prompt,/我的门将/);assert.match(prompt,/横向 42%/);assert.match(prompt,/42%,89%/);assert.match(prompt,/不代表真实首发/);assert.match(prompt,/区分事实与推测/);
});

test('official reference lineup includes eleven different verified profiles, keeps photos/notes across formations',()=>{
 const roster=JSON.parse(readFileSync(new URL('../src/lineup.json',import.meta.url),'utf8'));
 assert.equal(roster.date,'2026-10-10');const board=referenceBoard(roster);assert.equal(board.players.length,11);assert.equal(new Set(board.players.map(p=>p.profileId)).size,11);
 assert.equal(board.players.find(p=>p.id==='p7').number,'17');assert.equal(board.players.find(p=>p.id==='p9').name,'凯恩');
 board.players[0].note='右脚 · 队长';board.players[0].portrait='data:image/webp;base64,AAAA';board.players[1].portraitHidden=true;
 const next=normalizeBoard(arrangeBoard(board,'433'));assert.equal(next.players[0].profileId,'manuel-neuer');assert.equal(next.players[0].note,'右脚 · 队长');assert.equal(next.players[0].portrait,board.players[0].portrait);assert.equal(next.players[1].portraitHidden,true);
 const legacy=createBoard();assert.equal(isBlankBoard(legacy),true);legacy.players[0].x++;assert.equal(isBlankBoard(legacy),false);assert.equal(isBlankBoard(board),false);
 assert.match(boardPrompt(board),/右脚 · 队长/);assert.doesNotMatch(boardPrompt(board),/base64/);
});
test('photo data cannot introduce remote requests, SVG, scripts or unbounded local payloads',()=>{
 assert.equal(normalizePortrait('https://example.com/track.png'),'');assert.equal(normalizePortrait('data:image/svg+xml;base64,AAAA'),'');assert.equal(normalizePortrait('javascript:alert(1)'),'');assert.equal(normalizePortrait('data:image/webp;base64,'+'A'.repeat(20000)),'');
 const safe=normalizeBoard({...createBoard(),players:createBoard().players.map(p=>({...p,profileId:'../../bad',portrait:'https://example.com/track.png'}))});assert.equal(safe.players[0].profileId,'');assert.equal(safe.players[0].portrait,'');
});

test('legacy unnamed cards fill from the reference even after moving, drawing or saving a board',()=>{
 const roster=JSON.parse(readFileSync(new URL('../src/lineup.json',import.meta.url),'utf8'));
 for(const formation of ['4231','433']){
  const b=createBoard(formation);b.players.find(p=>p.id==='p9').x=61;b.lines=[{x1:30,y1:40,x2:50,y2:20}];b.players.find(p=>p.id==='p7').name='待填写';
  const filled=fillPlayerProfiles(b,roster);assert.equal(filled.formation,formation);assert.equal(filled.players.find(p=>p.id==='p9').x,61);assert.deepEqual(filled.lines,normalizeBoard(b).lines);assert.equal(filled.players.find(p=>p.id==='p7').number,'17');assert.equal(filled.players.find(p=>p.id==='p10').name,'赛巴里');assert.equal(filled.players.every(p=>p.name&&p.profileId),true);
  assert.deepEqual(fillPlayerProfiles(filled,roster),filled);
 }
});
test('profile completion preserves custom identities, numbers, notes and deliberate photo removal',()=>{
 const roster=JSON.parse(readFileSync(new URL('../src/lineup.json',import.meta.url),'utf8')),b=createBoard();
 Object.assign(b.players.find(p=>p.id==='p9'),{name:'我的前锋',number:'27',note:'回撤接应',portrait:'data:image/webp;base64,AAAA'});
 Object.assign(b.players.find(p=>p.id==='p2'),{name:'',number:'88',portraitHidden:true});
 const f=fillPlayerProfiles(b,roster);assert.deepEqual(f.players.find(p=>p.id==='p9'),b.players.find(p=>p.id==='p9'));assert.equal(f.players.find(p=>p.id==='p2').number,'88');assert.equal(f.players.find(p=>p.id==='p2').name,'戴维斯');assert.equal(f.players.find(p=>p.id==='p2').portraitHidden,true);
 const old=referenceBoard(roster);old.players[0].portraitHidden=true;assert.equal(fillPlayerProfiles(old,roster).players[0].portraitHidden,true);
});

import {createBackup,parseBackup,normalizePreferences} from '../src/studio.mjs';
test('portable backup retains studio photos and preferences without host state',()=>{
 const board=createBoard();board.players[0].portrait='data:image/png;base64,AA==';board.players[0].name='我的门将';
 const input={board,fan:{nickname:'南看台',number:'25',slogan:'MIA SAN MIA',skin:'silver'},savedBoards:[{id:'one',title:'第一套',board}],prefs:{zone:'Europe/Berlin',panelWidth:510,mini:false,strength:63,lead:60},conversation:'private text',apiKey:'secret'};
 const text=createBackup(input,new Date('2026-10-22T12:00:00Z')),result=parseBackup(text);
 assert.equal(result.board.players[0].portrait,board.players[0].portrait);assert.equal(result.savedBoards.length,1);assert.equal(result.fan.nickname,'南看台');assert.equal(result.prefs.mini,false);assert.equal(result.prefs.zone,'Europe/Berlin');assert.equal(result.prefs.panelWidth,510);assert.equal(result.prefs.strength,63);assert.equal(result.createdAt,'2026-10-22T12:00:00.000Z');assert.ok(!text.includes('private text')&&!text.includes('secret'));
});
test('restore rejects unsupported, incomplete or oversized backup before changing data',()=>{
 assert.throws(()=>parseBackup('{broken'),/无法读取/);assert.throws(()=>parseBackup('{}'),/受支持/);assert.throws(()=>parseBackup('x'.repeat(3*1024*1024+1)),/过大/);
 const value=JSON.parse(createBackup({board:createBoard()}));value.studio.board.players.pop();assert.throws(()=>parseBackup(JSON.stringify(value)),/不完整/);
 value.studio.board=createBoard();value.studio.savedBoards=[{id:'bad',title:'损坏',board:{}}];assert.throws(()=>parseBackup(JSON.stringify(value)),/不完整/);
});
test('backup preferences accept only bounded fields and never import unknown properties',()=>{
 const prefs=normalizePreferences({panelWidth:900,strength:-1,mini:'false',zone:'invalid',lead:999,railOrder:['focus','focus'],unknown:'ignored'});
 assert.equal(prefs.panelWidth,520);assert.equal(prefs.strength,20);assert.equal(prefs.mini,true);assert.equal(prefs.zone,'Asia/Shanghai');assert.equal(prefs.lead,30);assert.equal(prefs.unknown,undefined);assert.deepEqual(prefs.railOrder,['focus','matches','tactics']);
 assert.equal(normalizePreferences(null).strength,82);
});

import {addPassRoute} from '../src/studio.mjs';
test('route limit never discards existing routes and rejects zero-length paths',()=>{
 const board=createBoard();for(let i=0;i<40;i++)board.lines.push({id:'keep-'+i,x1:10,y1:10,x2:30,y2:30});const before=JSON.stringify(board);
 assert.throws(()=>addPassRoute(board,{x:20,y:20},{x:40,y:40}),/最多绘制/);assert.equal(JSON.stringify(board),before);
 assert.throws(()=>addPassRoute(createBoard(),{x:10,y:10},{x:10,y:10}),/不同/);assert.throws(()=>addPassRoute(createBoard(),{x:NaN,y:10},{x:40,y:40}),/无效/);
 const valid=addPassRoute(createBoard(),{x:-50,y:10},{x:120,y:30},'test');assert.equal(valid.lines.length,1);assert.equal(valid.lines[0].x1,2);assert.equal(valid.lines[0].x2,98);
});

import {writeLocalRestore} from '../src/studio.mjs';
test('backup rejects malformed nested data rather than replacing it with defaults',()=>{
 const fresh=()=>JSON.parse(createBackup({board:createBoard()})),reject=edit=>{const value=fresh();edit(value);assert.throws(()=>parseBackup(JSON.stringify(value)),/不完整/);};
 reject(v=>v.prefs=[]);reject(v=>v.prefs={});reject(v=>v.studio.fan=[]);reject(v=>v.studio.board.players[0].x='50');reject(v=>v.studio.board.players[0].portrait='https://example.invalid/picture.png');reject(v=>v.studio.board.lines=[{x1:1}]);reject(v=>{v.studio.savedBoards=[{id:'same',title:'a',board:createBoard()},{id:'same',title:'b',board:createBoard()}];});
});
test('restore rolls back a successful first write when the second write fails',()=>{
 const values=new Map([['studio','original board'],['prefs','original prefs']]);let writes=0;const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(++writes===2)throw Error('quota');values.set(k,v);},removeItem:k=>values.delete(k)};
 assert.deepEqual(writeLocalRestore(storage,[['studio','new board'],['prefs','new prefs']]),{ok:false,rollbackFailed:false});assert.equal(values.get('studio'),'original board');assert.equal(values.get('prefs'),'original prefs');
});
test('restore reports rollback failure and removes newly-created keys on normal rollback',()=>{
 const values=new Map();let writes=0;const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(++writes===2)throw Error('quota');values.set(k,v);},removeItem:k=>values.delete(k)};
 assert.equal(writeLocalRestore(storage,[['studio','new'],['prefs','new']]).rollbackFailed,false);assert.equal(values.size,0);
 writes=0;storage.setItem=(k,v)=>{if(++writes>=2)throw Error('denied');values.set(k,v);};storage.removeItem=()=>{throw Error('denied');};assert.deepEqual(writeLocalRestore(storage,[['studio','new'],['prefs','new']]),{ok:false,rollbackFailed:true});
});

test('tactics image filename retains Unicode and formation while removing path delimiters',()=>{
 assert.equal(boardPngFilename('  南看台/快照:一  ',createBoard('433')),'拜仁战术板-南看台_快照_一-4-3-3.png');
 assert.equal(boardPngFilename('...',createBoard()),'拜仁战术板-我的主场阵型-4-2-3-1.png');
 assert.equal(boardPngFilename('',createBoard()),'拜仁战术板-我的主场阵型-4-2-3-1.png');
});
import {compareBoardPositions} from '../src/studio.mjs';
test('position comparison matches stable player ids and never mutates either board',()=>{
 const baseline=createBoard(),current=structuredClone(baseline);current.players.reverse();const player=current.players.find(p=>p.id==='p9');player.x+=2;player.y+=5;player.name='自定义前锋';player.number='88';const a=JSON.stringify(current),b=JSON.stringify(baseline),diff=compareBoardPositions(current,baseline),row=diff.players.find(p=>p.id==='p9');
 assert.equal(diff.movedCount,1);assert.equal(diff.identityChangedCount,1);assert.deepEqual([row.dx,row.dy,row.number,row.before.number],[2,5,'88','9']);assert.equal(JSON.stringify(current),a);assert.equal(JSON.stringify(baseline),b);
});
test('position comparison ignores tiny drift and route ids but detects same-count route edits',()=>{
 const baseline=createBoard(),current=structuredClone(baseline);baseline.lines=[{id:'old',x1:20,y1:30,x2:70,y2:40}];current.lines=[{id:'new',x1:20,y1:30,x2:70,y2:40}];current.players[0].x+=.2;current.players[0].y-=.2;
 const same=compareBoardPositions(current,baseline);assert.equal(same.movedCount,0);assert.equal(same.routesChanged,false);current.lines[0].x2=75;const changed=compareBoardPositions(current,baseline);assert.equal(changed.routesChanged,true);assert.equal(changed.beforeRouteCount,1);assert.equal(changed.afterRouteCount,1);
});
test('formation comparison distinguishes shape changes from player and route counts',()=>{
 const baseline=createBoard(),current=arrangeBoard(baseline,'433'),diff=compareBoardPositions(current,baseline);assert.equal(diff.formationChanged,true);assert.ok(diff.movedCount>0);assert.equal(diff.players.length,11);assert.equal(diff.routesChanged,false);assert.equal(diff.identityChangedCount,0);
});

test('rehearsal keeps endpoints exact and does not invent passes between disconnected routes',()=>{
 const lines=[{x1:10,y1:90,x2:50,y2:50},{x1:80,y1:70,x2:80,y2:20}],before=JSON.stringify(lines);
 assert.equal(rehearsalFrame([],1),null);assert.deepEqual([rehearsalFrame(lines,0).x,rehearsalFrame(lines,0).y],[10,90]);
 const middle=rehearsalFrame(lines,.5);assert.deepEqual([middle.x,middle.y],[30,70]);assert.equal(middle.completed,0);
 const boundary=rehearsalFrame(lines,1);assert.deepEqual([boundary.index,boundary.x,boundary.y,boundary.completed],[0,50,50,1]);
 const next=rehearsalFrame(lines,1.1);assert.equal(next.index,1);assert.equal(next.x,80);assert.equal(next.switched,true);assert.ok(Math.abs(next.y-65)<1e-8);
 const end=rehearsalFrame(lines,10);assert.deepEqual([end.index,end.x,end.y,end.completed],[1,80,20,2]);assert.equal(JSON.stringify(lines),before);
});
test('rehearsal clamps view state, handles a single route and marks connected routes without a jump',()=>{
 const lines=[{x1:10,y1:90,x2:50,y2:50},{x1:50,y1:50,x2:80,y2:20}];assert.equal(rehearsalFrame(lines,1.5).switched,false);assert.equal(rehearsalFrame(lines,-2).progress,0);assert.equal(rehearsalFrame(lines,NaN).progress,0);const one=rehearsalFrame(lines.slice(0,1),1);assert.equal(one.fraction,1);assert.equal(one.completed,1);
});

test('explicit route starts stay distinct from previous endpoints without changing stepping semantics',()=>{
 const lines=[{x1:10,y1:90,x2:50,y2:50},{x1:80,y1:70,x2:80,y2:20}],before=JSON.stringify(lines);
 const end=rehearsalFrame(lines,1),start=rehearsalFrame(lines,1,true);assert.deepEqual([end.index,end.x,end.y],[0,50,50]);assert.deepEqual([start.index,start.x,start.y,start.fraction,start.switched],[1,80,70,0,true]);
 assert.deepEqual(rehearsalFrame(lines,1.25,true),rehearsalFrame(lines,1.25));assert.deepEqual(rehearsalFrame(lines,2,true),rehearsalFrame(lines,2));assert.equal(JSON.stringify(lines),before);
});

import {compileRehearsal,possessionFrame,wallPassPlan} from '../src/studio.mjs';
test('continuous possession transfers only after a pass and preserves positions across step boundaries',()=>{
 const board=createBoard();board.rehearsal=wallPassPlan(board);const before=JSON.stringify(board),plan=compileRehearsal(board);assert.equal(plan.error,'');assert.equal(plan.steps.length,3);
 for(let i=0;i<plan.steps.length;i++){const a=possessionFrame(plan,i+1),b=i+1<plan.steps.length?possessionFrame(plan,i+1,true):a;assert.deepEqual(a.positions,b.positions);assert.equal(a.holder,b.holder);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);}
 assert.equal(possessionFrame(plan,1).holder,'p10');assert.equal(possessionFrame(plan,2).holder,'p6');assert.equal(possessionFrame(plan,3).holder,'p6');assert.equal(JSON.stringify(board),before);
});
test('a passing runner releases the ball before moving, with no launch teleport or receiver mismatch',()=>{
 const board=createBoard();board.rehearsal=wallPassPlan(board);const plan=compileRehearsal(board),step=plan.steps[0],p=step.launch/step.duration;
 const before=possessionFrame(plan,p-1e-7),after=possessionFrame(plan,p+1e-7);assert.equal(before.holder,'p6');assert.equal(after.holder,null);assert.deepEqual(before.positions.p6,step.before.p6);assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.001);
 const received=possessionFrame(plan,(step.launch+step.flight+.001)/step.duration);assert.equal(received.holder,'p10');assert.deepEqual({x:received.x,y:received.y},received.positions.p10);assert.notDeepEqual(possessionFrame(plan,1).positions.p6,step.before.p6);
});
test('lead passes meet a moving receiver, off-ball runs retain possession and carrying keeps ball at feet',()=>{
 const board=createBoard();board.rehearsal={holder:'p6',steps:[{kind:'run',playerId:'p10',target:{x:65,y:25}},{kind:'pass',playerId:'p10',target:{x:70,y:15}},{kind:'carry',playerId:'p10',target:{x:75,y:10}}]};const plan=compileRehearsal(board);assert.equal(plan.error,'');
 for(const p of [.2,.7,1]){const f=possessionFrame(plan,p);assert.equal(f.holder,'p6');assert.deepEqual({x:f.x,y:f.y},f.positions.p6);}
 const step=plan.steps[1],receive=1+(step.launch+step.flight)/step.duration,f=possessionFrame(plan,receive+1e-8);assert.deepEqual(f.positions.p10,{x:70,y:15});assert.ok(Math.abs(f.x-70)<1e-6&&Math.abs(f.y-15)<1e-6);
 const carry=possessionFrame(plan,2.5);assert.equal(carry.holder,'p10');assert.deepEqual({x:carry.x,y:carry.y},carry.positions.p10);
});
test('invalid possession edits block the plan instead of inventing a ball transfer',()=>{
 const board=createBoard();for(const action of [{kind:'pass',playerId:'p6'},{kind:'run',playerId:'p6',target:{x:10,y:10}},{kind:'carry',playerId:'p10',target:{x:10,y:10}},{kind:'run',playerId:'p10'}]){board.rehearsal={holder:'p6',steps:[action]};const p=compileRehearsal(board);assert.ok(p.error.startsWith('第 1 步'));assert.equal(p.steps.length,0);assert.equal(p.holder,'p6');}
});
test('new plans survive save and strict backup roundtrips alongside unchanged legacy annotations',()=>{
 const board=createBoard();board.lines=[{id:'old',x1:10,y1:20,x2:30,y2:40}];board.rehearsal=wallPassPlan(board);const safe=normalizeBoard(board),data={board:safe,savedBoards:[{id:'plan',title:'跑位',board:safe}]},copy=parseBackup(createBackup(data));assert.deepEqual(copy.board,safe);assert.deepEqual(copy.savedBoards[0].board,safe);assert.match(boardPrompt(board),/连续配合/);
 const bad=JSON.parse(createBackup(data));bad.studio.board.rehearsal.steps[0].support.x='bad';assert.throws(()=>parseBackup(JSON.stringify(bad)),/不完整/);assert.deepEqual(normalizeBoard(createBoard()),createBoard());
});
test('distance controls the demonstration timing and repeated seeking never mutates the saved plan',()=>{
 const b=createBoard(),a=b.players.find(p=>p.id==='p6'),c=b.players.find(p=>p.id==='p10');Object.assign(c,{x:a.x+2,y:a.y});b.rehearsal={holder:a.id,steps:[{kind:'pass',playerId:c.id}]};const near=compileRehearsal(b);c.y=10;const far=compileRehearsal(b);assert.ok(far.steps[0].duration>near.steps[0].duration);const before=JSON.stringify(b);for(let i=0;i<200;i++)possessionFrame(far,i/199);assert.equal(JSON.stringify(b),before);
});

test('card PNG omits retired sequence metadata and keeps eleven players',()=>{
 const board=createBoard();board.rehearsal=wallPassPlan(board);const text=[],ctx=new Proxy({fillText(value){text.push(value);},measureText(value){return {width:value.length*8};}},{get(target,key){return key in target?target[key]:(()=>{});}}),canvas={getContext:()=>ctx};paintBoardSnapshot(canvas,board);assert.ok(text.some(t=>t.includes('11 张球员卡牌')));assert.ok(!text.some(t=>/步配合|传球路线|蓝色虚线/.test(t)));assert.equal(canvas.width,1200);assert.equal(canvas.height,1600);
});
test('card lineup prompt ignores archived passing data without mutating it',()=>{
 const b=createBoard();b.rehearsal=wallPassPlan(b);b.lines=[{id:'old',x1:1,y1:2,x2:3,y2:4}];const before=JSON.stringify(b),text=boardPrompt(b,{positionsOnly:true});assert.match(text,/球员卡牌阵型/);assert.ok(!/传球|配合|跑位/.test(text));assert.equal(JSON.stringify(b),before);
});
