const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const env={...process.env,TEMP:path.join(root,'.runtime'),TMP:path.join(root,'.runtime')};
fs.mkdirSync(env.TEMP,{recursive:true});
fs.mkdirSync(path.join(root,'.verification'),{recursive:true});
const server=spawn(process.execPath,['scripts/serve.cjs'],{cwd:root,env,stdio:['ignore','pipe','inherit'],windowsHide:true});
let active;
const stop=()=>{active?.kill();server.kill();};
process.on('SIGINT',()=>{stop();process.exitCode=130;});
(async()=>{try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Preview server startup timed out')),10000);const done=()=>clearTimeout(timeout);server.once('error',e=>{done();reject(e);});server.once('exit',code=>{done();reject(Error('Preview server exited '+code));});server.stdout.on('data',chunk=>{if(String(chunk).includes('http://127.0.0.1:')){done();resolve();}});});
 const suites=['verify-competitions.cjs','verify-regression-0.6.0.cjs','verify-backup-0.6.2.cjs','verify-focus-0.6.3.cjs','verify-navigation-0.6.4.cjs','verify-status-0.6.5.cjs','verify-season-0.6.7.cjs','verify-compact-0.7.0.cjs','verify-context-0.7.3.cjs','verify-profile-fold-0.7.4.cjs','verify-settings-0.7.5.cjs','verify-discussion-0.7.6.cjs','verify-card-lineup-0.12.0.cjs','verify-bench.cjs','verify-card-swap.cjs','verify-work.cjs','verify-work-snapshots.cjs','verify-work-commands.cjs','verify-work-backup.cjs','verify-work-input.cjs','verify-work-paste.cjs','verify-work-todos.cjs'],requested=process.argv.slice(2);if(requested.some(s=>!suites.includes(s)))throw Error('Unknown UI suite');
 for(const script of (requested.length?requested:suites)){
   console.log('\nRunning '+script);
   await new Promise((resolve,reject)=>{active=spawn(process.execPath,[path.join('scripts',script)],{cwd:root,env,stdio:'inherit',windowsHide:true});active.once('error',reject);active.once('exit',code=>code===0?resolve():reject(Error(script+' exited '+code)));});
 }
}finally{stop();}})().catch(error=>{console.error(error);process.exitCode=1;});
