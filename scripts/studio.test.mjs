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
