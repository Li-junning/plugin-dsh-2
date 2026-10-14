  function StudioHeading({eyebrow,title,copy}) {
    return h('div',{className:'bh-page-heading'},h('span',{className:'bh-eyebrow'},eyebrow),h('h2',null,title),h('p',{className:'bh-copy'},copy));
  }
  function Field({label,children,detail}) {return h('label',{className:'bh-field'},h('span',null,label),children,detail?h('small',null,detail):null);}
  function PlayerPortrait({player,large=false}) {
    const photo=player.portrait || (!player.portraitHidden && PLAYER_PHOTOS[player.profileId]);
    return photo?h('img',{className:'bh-portrait-photo',src:photo,alt:'',draggable:false}):h('svg',{className:'bh-portrait-placeholder',viewBox:'0 0 100 100','aria-hidden':true},h('circle',{cx:50,cy:29,r:15,fill:'currentColor',opacity:.88}),h('path',{d:'M20 96V77c0-18 13-29 30-29s30 11 30 29v19Z',fill:'currentColor',opacity:.66}),h('path',{d:'M37 51 50 63 63 51M28 75v21M72 75v21',fill:'none',stroke:'#ffffff50',strokeWidth:2}),h('text',{x:50,y:86,textAnchor:'middle',fill:'#ffffff',fontSize:20,fontWeight:750},player.number));
  }
  function PlayerCardFace({player}) {
    const position=({'门将':'GK','左后卫':'LB','右后卫':'RB','中卫':'CB','后腰':'DMF','中前卫':'CMF','前腰':'AMF','左边锋':'LWF','右边锋':'RWF','中锋':'CF'})[player.role] || 'MF';
    return h(React.Fragment,null,h('span',{className:'bh-lineup-art'},h(PlayerPortrait,{player}),h('b',{className:'bh-lineup-number'},player.number),h('span',{className:'bh-card-position'},position),h('img',{className:'bh-lineup-crest',src:CREST,alt:'',draggable:false}),h('i',{className:'bh-card-edition','aria-hidden':true},'XI')),h('strong',{className:'bh-lineup-name'},player.name.trim() || '待填写'),h('small',{className:'bh-lineup-role'},h('span',null,player.role),h('i',{'aria-hidden':true},'FCB')));
  }
  function Tactics({s}) {
    const [mode,setMode]=React.useState('move'),[selected,setSelected]=React.useState('p9'),[title,setTitle]=React.useState('我的主场阵型'),[prompt,setPrompt]=React.useState(''),[preview,setPreview]=React.useState(null),[revision,setRevision]=React.useState(0),[uploading,setUploading]=React.useState(false),[photoError,setPhotoError]=React.useState('');
    const pitchRef=React.useRef(null),gesture=React.useRef(null),anchor=React.useRef(null),history=React.useRef([]),photoInput=React.useRef(null),photoJob=React.useRef(0);
    React.useEffect(()=>()=>{photoJob.current++;},[]);
    const board=s.board,player=board.players.find(p=>p.id===selected)||board.players[0];
    const snapshot=()=>{history.current=[...history.current.slice(-24),JSON.parse(JSON.stringify(state.board))];setRevision(v=>v+1);};
    const change=(next,remember=true)=>{if(remember)snapshot();patchStudio({board:next,formation:next.formation});};
    const point=e=>{const r=pitchRef.current.getBoundingClientRect(),target=e.target.closest('[data-player]'),p=target&&state.board.players.find(p=>p.id===target.dataset.player);return p && mode==='route'?{x:p.x,y:p.y}:{x:bound((e.clientX-r.left)/r.width*100,2,98),y:bound((e.clientY-r.top)/r.height*100,2,98)};};
    function clampPlayer(pos,id) {const r=pitchRef.current.getBoundingClientRect(),card=pitchRef.current.querySelector('[data-player="'+id+'"]')?.getBoundingClientRect(),x=(card?.width || 50)/r.width*50+1,y=(card?.height || 78)/r.height*50+1;return {x:bound(pos.x,Math.max(5,x),Math.min(95,100-x)),y:bound(pos.y,Math.max(7,y),Math.min(93,100-y))};}
    function down(e) {
      if(e.button!==0)return;
      const id=e.target.closest('[data-player]')?.dataset.player;
      if(mode==='move' && !id)return;
      e.preventDefault();pitchRef.current.setPointerCapture(e.pointerId);
      if(mode==='move'){snapshot();setSelected(id);gesture.current={kind:'player',id,initial:state.board};}
      else {const tap=point(e),from=anchor.current || tap;gesture.current={kind:'route',from,to:tap,tap,moved:false};setPreview({x1:from.x,y1:from.y,x2:from.x,y2:from.y});}
    }
    function move(e) {
      const g=gesture.current,p=point(e);
      if(g?.kind==='player')patchStudio({board:{...state.board,players:state.board.players.map(v=>v.id===g.id?{...v,...clampPlayer(p,g.id)}:v)}},false);
      if(g?.kind==='route'){g.to=p;if(Math.hypot(p.x-g.tap.x,p.y-g.tap.y)>2)g.moved=true;setPreview({x1:g.from.x,y1:g.from.y,x2:p.x,y2:p.y});}
      else if(!g && mode==='route' && anchor.current)setPreview({x1:anchor.current.x,y1:anchor.current.y,x2:p.x,y2:p.y});
    }
    function up(e) {
      const g=gesture.current;if(!g)return;
      gesture.current=null;
      if(g.kind==='player')saveStudio();
      else {
        const to=g.moved?g.to:g.tap,distance=Math.hypot(to.x-g.from.x,to.y-g.from.y);
        if(distance<2){anchor.current=g.from;setPreview(null);}
        else if(state.board.lines.length>=40){anchor.current=null;setPreview(null);notify('最多绘制 40 条路线，请先删除一些。');}
        else {change({...state.board,lines:[...state.board.lines,{id:'line-'+Date.now(),x1:g.from.x,y1:g.from.y,x2:to.x,y2:to.y}]});anchor.current=null;setPreview(null);}
      }
      if(pitchRef.current.hasPointerCapture(e.pointerId))pitchRef.current.releasePointerCapture(e.pointerId);
    }
    function cancel() {const g=gesture.current;gesture.current=null;anchor.current=null;setPreview(null);if(g?.kind==='player')patchStudio({board:g.initial});}
    function editPlayer(patch){change({...state.board,players:state.board.players.map(p=>p.id===player.id?{...p,...patch}:p)},false);}
    async function uploadPhoto(event) {
      const file=event.target.files?.[0];event.target.value='';if(!file)return;
      setPhotoError('');
      if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>8*1024*1024){setPhotoError('请选择 8 MB 以内的 JPG、PNG 或 WebP 照片。');return;}
      const id=player.id,job=++photoJob.current;setUploading(true);let image;
      try {
        image=await createImageBitmap(file,{imageOrientation:'from-image'});
        if(!image.width || !image.height || image.width*image.height>24000000)throw Error('照片尺寸过大，请选择较小的图片。');
        const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');if(!ctx)throw Error('此窗口暂不支持照片处理。');
        const scale=Math.max(128/image.width,160/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,(128-w)/2,(160-h)/2,w,h);
        let data='';for(const quality of [.86,.7,.5,.35]){data=canvas.toDataURL('image/webp',quality);if(data.length<=20000 && normalizePortrait(data))break;}
        if(!normalizePortrait(data))throw Error('照片压缩后仍过大，请换一张简单背景的照片。');
        if(job!==photoJob.current)return;
        snapshot();const saved=patchStudio({board:{...state.board,players:state.board.players.map(p=>p.id===id?{...p,portrait:data,portraitHidden:false}:p)}});if(saved)notify('球员照片已保存在本机。');
      }catch(error){if(job===photoJob.current)setPhotoError(error.message || '照片读取失败，请换一张图片。');}
      finally{image?.close();if(job===photoJob.current)setUploading(false);}
    }
    function undo(){const old=history.current.pop();if(!old)return;patchStudio({board:old,formation:old.formation});setRevision(v=>v+1);anchor.current=null;setPreview(null);}
    function saveBoard(){
      const name=cleanText(title,24);if(!name){notify('给这套阵型起一个名字吧。');return;}
      const existing=state.savedBoards.find(v=>v.title===name);
      if(!existing && state.savedBoards.length>=8){notify('已保存 8 套阵型，请先删除一套再保存。');return;}
      const row={id:existing?.id || 'board-'+Date.now(),title:name,board:normalizeBoard(state.board)};
      const saved=existing?state.savedBoards.map(v=>v.id===existing.id?row:v):[...state.savedBoards,row];
      if(patchStudio({savedBoards:saved}))notify('「'+name+'」已保存在本机。');
    }
    function discuss(){const text=boardPrompt(state.board);if(currentInput){currentInput.actions.setDraft(currentInput.draft?currentInput.draft+'\n\n'+text:text);notify('站位、名字和传球路线已放入对话草稿。');close();}else{setPrompt(text);notify('先选一个 DSH 对话，或复制下面的战术话题。');}}
    const profile=OFFICIAL_LINEUP.players.find(p=>p.id===player.profileId),hasPhoto=!!(player.portrait || (!player.portraitHidden && PLAYER_PHOTOS[player.profileId]));
    const lineNode=(line,i,temporary=false)=>h('g',{key:temporary?'preview':line.id+'-'+i},h('line',{x1:line.x1,y1:line.y1,x2:line.x2,y2:line.y2,stroke:temporary?'#ffffff99':'#ffdf8a',strokeWidth:.65,strokeDasharray:temporary?'2 1':undefined,markerEnd:'url(#bh-route-arrow)'}));
    return h(React.Fragment,null,h(StudioHeading,{eyebrow:'TACTICS STUDIO',title:'把你的想法，摆上球场。',copy:'11 个位置，11 张个人名片。点选编辑，拖动排阵，再画出你的进攻路线。'}),
      h('div',{className:'bh-lineup-reference'},h('div',null,h('span',{className:'bh-eyebrow'},'首发参考 · '+OFFICIAL_LINEUP.date),h('strong',null,'拜仁 vs '+OFFICIAL_LINEUP.opponent),h('a',{href:OFFICIAL_LINEUP.source,target:'_blank',rel:'noreferrer'},'官方名单 ↗')),h('button',{className:'bh-button',onClick:()=>{cancel();change(referenceBoard(OFFICIAL_LINEUP));notify('已载入 '+OFFICIAL_LINEUP.date+' 参考首发；可撤销。');}},'载入首发')),
      h('div',{className:'bh-studio-card bh-board-card'},h('div',{className:'bh-board-top'},h('div',{className:'bh-segment'},['4231','433'].map(f=>h('button',{key:f,className:'bh-button','aria-pressed':board.formation===f,onClick:()=>{cancel();change(arrangeBoard(state.board,f));}},f==='4231'?'4-2-3-1':'4-3-3'))),h('span',{className:'bh-board-direction'},'进攻方向 ↑')),
        h('div',{className:'bh-editor-tools'},h('button',{className:'bh-tool-button','aria-pressed':mode==='move',onClick:()=>{cancel();setMode('move');}},h(Icon,{name:'move',size:15}),'移动球员'),h('button',{className:'bh-tool-button','aria-pressed':mode==='route',onClick:()=>{cancel();setMode('route');}},h(Icon,{name:'route',size:15}),'画传球线'),h('button',{className:'bh-tool-button bh-undo',disabled:!history.current.length,onClick:undo,'aria-label':'撤销上一步'},h(Icon,{name:'undo',size:16}))),
        h('div',{className:'bh-pitch bh-editor-pitch',ref:pitchRef,'data-tool':mode,'aria-label':'可编辑战术板，球员可拖动或用方向键移动',onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:cancel,onKeyDown:e=>{if(e.key==='Escape'){cancel();e.stopPropagation();}}},
          h('div',{className:'bh-pitch-lines'}),h('span',{className:'bh-pitch-goal bh-pitch-goal-top'}),h('span',{className:'bh-pitch-goal bh-pitch-goal-bottom'}),
          h('svg',{className:'bh-route-layer',viewBox:'0 0 100 100',preserveAspectRatio:'none','aria-hidden':true},h('defs',null,h('marker',{id:'bh-route-arrow',viewBox:'0 0 6 6',refX:5,refY:3,markerWidth:4,markerHeight:4,orient:'auto'},h('path',{d:'M0 0 6 3 0 6Z',fill:'#ffdf8a'}))),board.lines.map((l,i)=>lineNode(l,i)),preview?lineNode(preview,0,true):null),
          board.players.map(p=>h('button',{className:'bh-player bh-edit-player bh-collectible'+(p.id==='p1'?' bh-goalkeeper':'')+(player.id===p.id?' bh-selected':''),key:p.id,'data-player':p.id,style:{left:p.x+'%',top:p.y+'%'},'aria-label':`选择球员 ${p.number} ${p.name || p.role}`,'aria-describedby':'bh-player-card-hint','aria-pressed':player.id===p.id,onClick:()=>setSelected(p.id),onKeyDown:e=>{
            const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
            if(delta){e.preventDefault();const step=e.shiftKey?5:1;change({...state.board,players:state.board.players.map(v=>v.id===p.id?{...v,...clampPlayer({x:v.x+delta[0]*step,y:v.y+delta[1]*step},v.id)}:v)});}
            if(mode==='route' && ['Enter',' '].includes(e.key)){e.preventDefault();if(anchor.current){change({...state.board,lines:[...state.board.lines.slice(0,39),{id:'line-'+Date.now(),x1:anchor.current.x,y1:anchor.current.y,x2:p.x,y2:p.y}]});anchor.current=null;setPreview(null);}else anchor.current={x:p.x,y:p.y};}
          }},h(PlayerCardFace,{player:p})))),
        h('p',{className:'bh-editor-hint',id:'bh-player-card-hint'},mode==='route'?'拖出一条路线，或依次点击起点与终点；Esc 取消。':'点选名片编辑个人信息；拖动排阵，方向键微调。'),
        h('section',{className:'bh-player-profile','aria-label':'球员个人名片编辑'},h('div',{className:'bh-profile-heading'},h('span',{className:'bh-eyebrow'},'STARTING XI / 球员名片'),h('span',{className:'bh-local-badge'},'本机保存')),h('div',{className:'bh-profile-identity'},h('div',{className:'bh-collectible bh-profile-collectible'+(player.id==='p1'?' bh-goalkeeper':'')},h(PlayerCardFace,{player})),h('div',{className:'bh-profile-copy'},h('small',null,player.role+' · NO. '+player.number),h('h3',null,player.name.trim() || '写下球员名字'),profile?h('span',{className:'bh-profile-fullname'},profile.fullName):null,h('p',null,player.note.trim() || '让每一位首发，都有自己的主场名片。'))),h('div',{className:'bh-photo-actions'},h('input',{ref:photoInput,type:'file',accept:'image/jpeg,image/png,image/webp',hidden:true,'aria-label':'上传球员照片',onChange:uploadPhoto}),h('button',{className:'bh-button',disabled:uploading,onClick:()=>photoInput.current?.click()},uploading?'正在处理…':hasPhoto?'更换照片':'上传照片'),hasPhoto?h('button',{className:'bh-text-action',disabled:uploading,onClick:()=>{snapshot();editPlayer({portrait:'',portraitHidden:true});}},'移除照片'):null,h('span',null,'JPG / PNG / WebP · 自动裁切'),profile?h('a',{className:'bh-profile-source',href:profile.profile,target:'_blank',rel:'noreferrer'},'德甲官方资料 ↗'):null),photoError?h('p',{className:'bh-photo-error',role:'alert'},photoError):null,
        h('div',{className:'bh-player-form'},h(Field,{label:'球衣号码'},h('input',{className:'bh-text-input',inputMode:'numeric',maxLength:2,'aria-label':'球员球衣号码',onFocus:snapshot,value:player.number,onChange:e=>editPlayer({number:e.target.value.replace(/\D/g,'').slice(0,2)})})),h(Field,{label:'球员名字 · '+player.role},h('input',{className:'bh-text-input',maxLength:16,'aria-label':'球员名字',onFocus:snapshot,placeholder:player.role,value:player.name,onChange:e=>editPlayer({name:e.target.value.replace(/[\u0000-\u001f]/g,'').slice(0,16)})}))),
        h(Field,{label:'个人备注',detail:'例如惯用脚、特点或你安排的职责，最多 48 字。'},h('input',{className:'bh-text-input',maxLength:48,'aria-label':'球员个人备注',onFocus:snapshot,value:player.note || '',placeholder:'例如：右脚 · 回撤接应 · 终结者',onChange:e=>editPlayer({note:e.target.value.replace(/[\u0000-\u001f]/g,'').slice(0,48)})}))),
        board.lines.length?h('div',{className:'bh-routes-list'},h('div',{className:'bh-section-top'},h('strong',null,'传球路线 · '+board.lines.length),h('button',{className:'bh-text-action',onClick:()=>change({...state.board,lines:[]})},'清空路线')),h('div',{className:'bh-route-chips'},board.lines.map((line,i)=>h('button',{key:line.id+'-'+i,onClick:()=>change({...state.board,lines:state.board.lines.filter((_,j)=>j!==i)}),'aria-label':'删除路线 '+(i+1)},'路线 '+(i+1)+' ×')))):null),
      h('section',{className:'bh-studio-card'},h('div',{className:'bh-section-top'},h('h3',null,'我的阵型库'),h('span',{className:'bh-local-badge'},'本机保存')),h('div',{className:'bh-save-row'},h('input',{className:'bh-text-input',maxLength:24,'aria-label':'阵型名称',value:title,onChange:e=>setTitle(e.target.value),placeholder:'给这套阵型起个名字'}),h('button',{className:'bh-button',onClick:saveBoard},h(Icon,{name:'save',size:15}),'保存阵型')),
        s.savedBoards.length?h('div',{className:'bh-saved-list'},s.savedBoards.map(v=>h('div',{className:'bh-saved-row',key:v.id},h('button',{className:'bh-load-board',onClick:()=>{change(fillPlayerProfiles(v.board,OFFICIAL_LINEUP));setTitle(v.title);}},h(Icon,{name:'tactics',size:16}),h('span',null,h('strong',null,v.title),h('small',null,(v.board.formation==='433'?'4-3-3':'4-2-3-1')+' · '+v.board.lines.length+' 条路线'))),h('button',{className:'bh-delete-button','aria-label':'删除阵型 '+v.title,onClick:()=>patchStudio({savedBoards:state.savedBoards.filter(row=>row.id!==v.id)})},h(Icon,{name:'close',size:14}))))):h('p',{className:'bh-empty-copy'},'保存第一套阵型，下次打开还能接着调整。')),
      h('button',{className:'bh-button bh-primary bh-wide',onClick:discuss},'带着这张战术板聊球 ↗'),prompt?h('textarea',{className:'bh-text-input bh-prompt',readOnly:true,value:prompt,'aria-label':'可复制的战术话题',onFocus:e=>e.target.select()}):null,
      h('p',{className:'bh-footnote'},'参考名单：2026-10-10 对奥格斯堡；照片：德甲官方。站位可自定义，并非实时首发。照片与编辑仅保存在本机。'));
  }
  function FanCard({s}) {
    const canvasRef=React.useRef(null),crestRef=React.useRef(null),[ready,setReady]=React.useState(false),[error,setError]=React.useState('');
    React.useEffect(()=>{let active=true;const img=new Image();img.onload=()=>{if(!active)return;try{crestRef.current=img;paintFanCard(canvasRef.current,state.fan,img);setReady(true);setError('');}catch{setError('名片预览暂时不可用，请重新打开面板。');}};img.onerror=()=>{if(active)setError('队徽加载失败，请重新打开面板。');};img.src=CREST;return()=>{active=false;};},[]);
    React.useLayoutEffect(()=>{if(crestRef.current)paintFanCard(canvasRef.current,s.fan,crestRef.current);},[s.fan]);
    const update=patch=>patchStudio({fan:{...state.fan,...patch}});
    function exportCard(){const canvas=canvasRef.current;if(!canvas || !ready || !crestRef.current)return;const fan=normalizeFan(state.fan);paintFanCard(canvas,fan,crestRef.current);canvas.toBlob(blob=>{if(!blob){notify('图片导出失败，请稍后重试。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=pngFilename(fan);a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('名片 PNG 已导出。');},'image/png');}
    return h(React.Fragment,null,h(StudioHeading,{eyebrow:'FAN CARD ATELIER',title:'把热爱，写上你的名字。',copy:'一张属于你的主场名片。修改即预览，导出即可分享。'}),
      h('div',{className:'bh-card-preview'},h('canvas',{ref:canvasRef,width:1200,height:750,role:'img','aria-label':'球迷名片实时预览：'+(s.fan.nickname || '你的名字')+'，号码 '+s.fan.number})),error?h('div',{className:'bh-alert',role:'status'},error):null,
      h('div',{className:'bh-card-caption'},h('span',null,'FAN ID · 1200 × 750'),h('span',null,'仅保存在本机')),
      h('section',{className:'bh-studio-card'},h('div',{className:'bh-section-top'},h('h3',null,'你的名片信息'),h(Icon,{name:'card',size:17})),h('div',{className:'bh-fan-fields'},h(Field,{label:'球迷昵称'},h('input',{className:'bh-text-input',maxLength:16,'aria-label':'球迷昵称',value:s.fan.nickname,onChange:e=>update({nickname:e.target.value.replace(/[\u0000-\u001f]/g,'').slice(0,16)})})),h(Field,{label:'球衣号码'},h('input',{className:'bh-text-input',maxLength:2,inputMode:'numeric','aria-label':'名片球衣号码',value:s.fan.number,onChange:e=>update({number:e.target.value.replace(/\D/g,'').slice(0,2)})}))),
        h(Field,{label:'主场标语',detail:'最多 36 个字符；也可以写下你自己的口号。'},h('textarea',{className:'bh-text-input bh-slogan-input',maxLength:36,'aria-label':'主场标语',value:s.fan.slogan,onChange:e=>update({slogan:e.target.value.replace(/[\u0000-\u001f]/g,'').slice(0,36)})})),
        h('div',{className:'bh-style-picker','aria-label':'名片样式'},[['red','主场红'],['silver','客场银']].map(([id,label])=>h('button',{className:'bh-style-option',key:id,'aria-pressed':s.fan.skin===id,onClick:()=>update({skin:id})},h('i',{'data-skin':id}),label)))),
      h('button',{className:'bh-button bh-primary bh-wide',disabled:!ready||!!error,onClick:exportCard},h(Icon,{name:'download',size:17}),'导出名片 PNG'),h('p',{className:'bh-footnote'},'图片在本机生成。分享由你自行操作；此名片为非官方球迷创作。'));
  }
  function LayoutEditor({s}) {
    const labels={matches:'赛程与比分',tactics:'战术灵感',focus:'专注阅读'},icons={matches:'calendar',tactics:'tactics',focus:'focus'};
    function reorder(index,delta){const order=[...state.prefs.railOrder],to=index+delta;if(to<0||to>=order.length)return;[order[index],order[to]]=[order[to],order[index]];preferences({railOrder:order});}
    const samePreset=id=>{const p=layoutPreset(id);return Object.keys(p).every(k=>JSON.stringify(p[k])===JSON.stringify(s.prefs[k]));};
    return h(React.Fragment,null,h(StudioHeading,{eyebrow:'YOUR HOME, YOUR RULES',title:'把主场，调成你的习惯。',copy:'边调整，边看效果。布局自动保存在本机。'}),
      h('div',{className:'bh-layout-map','aria-label':'当前主场布局示意'},h('span',{className:'bh-map-caption'},'布局预览'),h('div',{className:'bh-map-sidebar'}),h('div',{className:'bh-map-chat'},h('i'),h('i'),h('i')),s.prefs.mini?h('div',{className:'bh-map-mini','data-position':s.prefs.miniPosition},h('i'),h('span',null,'下一场')):null,h('div',{className:'bh-map-rail'},s.prefs.railOrder.map(id=>h('i',{key:id}))),h('div',{className:'bh-map-panel',style:{width:(s.prefs.panelWidth/520*29)+'%'}},h('span',null,'主场面板'),h('i'),h('i'),h('i'))),
      h('div',{className:'bh-layout-presets'},[['simple','简洁','聊天优先，工具随用随开。'],['matchday','比赛日','展开工具，让比赛触手可及。']].map(([id,label,copy])=>h('button',{className:'bh-preset',key:id,'aria-pressed':samePreset(id),onClick:()=>{if(preferences(layoutPreset(id)))notify('已切换为「'+label+'」布局。');}},h(Icon,{name:id==='simple'?'focus':'calendar',size:20}),h('strong',null,label),h('small',null,copy),samePreset(id)?h('span',{className:'bh-preset-check'},'✓'):null))),
      h('section',{className:'bh-studio-card'},h('div',{className:'bh-section-top'},h('h3',null,'面板与比赛卡'),h('span',{className:'bh-local-badge'},'即时生效')),h('div',{className:'bh-width-label'},h('label',{htmlFor:'bh-panel-width'},'面板宽度'),h('output',{htmlFor:'bh-panel-width'},s.prefs.panelWidth+' px')),h('input',{id:'bh-panel-width',className:'bh-range',type:'range',min:360,max:520,step:10,value:s.prefs.panelWidth,'aria-label':'面板宽度',onChange:e=>preferences({panelWidth:Number(e.target.value)})}),h('p',{className:'bh-field-detail'},'窄窗口自动适配，不会超出屏幕。'),
        h(Field,{label:'迷你比赛卡位置'},h('select',{className:'bh-text-input','aria-label':'迷你比赛卡位置',value:s.prefs.miniPosition,onChange:e=>preferences({miniPosition:e.target.value})},h('option',{value:'top-right'},'右上方'),h('option',{value:'top-left'},'左上方'),h('option',{value:'bottom-right'},'右下方'))),toggle('迷你比赛卡','聊天或专注阅读时自动收起。','mini',s),toggle('固定快捷工具','关闭后恢复悬停展开。','railPinned',s)),
      h('section',{className:'bh-studio-card'},h('div',{className:'bh-section-top'},h('h3',null,'快捷工具顺序'),h(Icon,{name:'sort',size:18})),h('div',{className:'bh-order-list'},s.prefs.railOrder.map((id,index)=>h('div',{className:'bh-order-row',key:id},h('span',{className:'bh-order-index'},String(index+1).padStart(2,'0')),h(Icon,{name:icons[id],size:17}),h('strong',null,labels[id]),h('button',{className:'bh-order-button','aria-label':'上移'+labels[id],disabled:index===0,onClick:()=>reorder(index,-1)},'↑'),h('button',{className:'bh-order-button','aria-label':'下移'+labels[id],disabled:index===2,onClick:()=>reorder(index,1)},'↓'))))),
      h('button',{className:'bh-button bh-wide',onClick:()=>{if(preferences({...DEFAULT_LAYOUT,mini:true,railPinned:false}))notify('已恢复默认主场布局。');}},'恢复默认布局'),h('p',{className:'bh-footnote'},'只调整布局，不会清除阵型、名片或封存赛果设置。'));
  }
