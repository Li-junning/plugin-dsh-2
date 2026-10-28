import {cleanText,normalizeBoard} from './studio.mjs';
// Native canvas export. Images are supplied by the caller from local embedded data.
export function boardPngFilename(title,board) {
  const name=cleanText(title || '我的主场阵型',24).replace(/[<>:"/\\|?*]/g,'_').replace(/[. ]+$/,'') || '我的主场阵型';
  return `拜仁战术板-${name}-${normalizeBoard(board).formation==='433'?'4-3-3':'4-2-3-1'}.png`;
}
export function paintBoardSnapshot(canvas,value,{title='我的主场阵型',portraits={}}={}) {
  const board=normalizeBoard(value),ctx=canvas.getContext('2d');if(!ctx)throw Error('当前窗口不支持图片导出，请重新打开后重试。');
  canvas.width=1200;canvas.height=1600;ctx.clearRect(0,0,1200,1600);
  const rect=(x,y,w,h,r,fill)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();};
  ctx.fillStyle='#111918';ctx.fillRect(0,0,1200,1600);ctx.fillStyle='#e20032';ctx.fillRect(48,42,7,70);
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#f8f8f2';ctx.font='600 37px "Microsoft YaHei",sans-serif';ctx.fillText(cleanText(title,24)||'我的主场阵型',76,66,1060);
  ctx.fillStyle='#a9bab2';ctx.font='20px "Microsoft YaHei",sans-serif';ctx.fillText((board.formation==='433'?'4-3-3':'4-2-3-1')+'  ·  '+board.players.length+' 张球员卡牌  ·  进攻方向 ↑',76,109);
  const field={x:48,y:156,w:1104,h:1184},position=(x,y)=>[field.x+x/100*field.w,field.y+y/100*field.h];
  ctx.save();ctx.beginPath();ctx.roundRect(field.x,field.y,field.w,field.h,18);ctx.clip();
  for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#20523f':'#194b3b';ctx.fillRect(field.x,field.y+i*field.h/8,field.w,field.h/8);}
  ctx.strokeStyle='#d8f0df88';ctx.lineWidth=2;ctx.strokeRect(field.x+36,field.y+38,field.w-72,field.h-76);
  const midY=field.y+field.h/2;ctx.beginPath();ctx.moveTo(field.x+36,midY);ctx.lineTo(field.x+field.w-36,midY);ctx.stroke();ctx.beginPath();ctx.arc(600,midY,106,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(600,midY,4,0,Math.PI*2);ctx.fillStyle='#d8f0dfaa';ctx.fill();
  for(const edge of ['top','bottom']){const top=edge==='top';ctx.strokeRect(330,top?field.y+38:field.y+field.h-238,540,200);ctx.strokeRect(450,top?field.y+38:field.y+field.h-108,300,70);}
  ctx.restore();
  for(const player of board.players){const [x,y]=position(player.x,player.y);rect(x-68,y-51,136,108,10,'#101d1de8');ctx.strokeStyle='#d7c188';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-68,y-51,136,108,10);ctx.stroke();
    const image=portraits[player.id];ctx.save();ctx.beginPath();ctx.arc(x-24,y-19,24,0,Math.PI*2);ctx.clip();ctx.fillStyle='#36594c';ctx.fillRect(x-48,y-43,48,48);if(image){const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(w>0&&h>0){const scale=Math.max(48/w,48/h);ctx.drawImage(image,x-24-w*scale/2,y-19-h*scale/2,w*scale,h*scale);}}ctx.restore();
    ctx.textAlign='center';ctx.fillStyle='#f6df9d';ctx.font='700 28px "Microsoft YaHei",sans-serif';ctx.fillText(player.number,x+30,y-22);ctx.fillStyle='#afc1b5';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText(player.role,x+30,y+1,62);
    ctx.fillStyle='#ffffff';ctx.font='16px "Microsoft YaHei",sans-serif';const text=Array.from(player.name||player.role);let lines=[''];for(const char of text){const i=lines.length-1;if(ctx.measureText(lines[i]+char).width>122&&lines.length<2)lines.push(char);else lines[i]+=char;}lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,x,y+24+i*21,122));
  }
  ctx.textAlign='left';ctx.fillStyle='#e8eee8';ctx.font='600 22px "Microsoft YaHei",sans-serif';ctx.fillText('我的阵型，留一张快照。',64,1400);ctx.fillStyle='#a9bab2';ctx.font='18px "Microsoft YaHei",sans-serif';ctx.fillText('球员卡牌与自定义站位 · 非实时首发',64,1442);ctx.fillStyle='#7f9589';ctx.font='16px "Microsoft YaHei",sans-serif';ctx.fillText('拜仁主场  /  MIA SAN MIA',64,1526);
  return canvas;
}
