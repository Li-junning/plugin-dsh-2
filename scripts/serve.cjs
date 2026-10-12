const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'.runtime'),{recursive:true});
const allowed=new Map([['/tools/preview.html','text/html; charset=utf-8'],['/tools/vendor/react.production.min.js','text/javascript'],['/tools/vendor/react-dom.production.min.js','text/javascript'],['/lib/client.js','text/javascript']]);
const server=http.createServer((req,res)=>{if(req.url==='/'){res.writeHead(302,{location:'/tools/preview.html'});return res.end();}let url;try{url=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400);return res.end();}if(!allowed.has(url)){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':allowed.get(url),'Cache-Control':'no-store'});fs.createReadStream(path.join(root,url)).pipe(res);});
server.listen(0,'127.0.0.1',()=>{const info={pid:process.pid,port:server.address().port,url:`http://127.0.0.1:${server.address().port}/tools/preview.html`,root};fs.writeFileSync(path.join(root,'.runtime','preview-server.json'),JSON.stringify(info,null,2));console.log(info.url);});
