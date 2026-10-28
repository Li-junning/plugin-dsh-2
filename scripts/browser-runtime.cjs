const fs=require('node:fs'),path=require('node:path');
const explicitModule=process.env.DSH_PLAYWRIGHT_MODULE;
const candidates=explicitModule?[path.resolve(explicitModule)]:['playwright',...(process.env.USERPROFILE?[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')]:[])];
let chromium;
for(const candidate of candidates){try{chromium=require(candidate).chromium;if(chromium)break;}catch{}}
if(!chromium)throw Error('UI 验证需要 Playwright。请在项目环境中提供 playwright，或将 DSH_PLAYWRIGHT_MODULE 设置为已安装的 Playwright 包目录。');
const explicitBrowser=process.env.DSH_BROWSER_PATH;
if(explicitBrowser&&!fs.existsSync(path.resolve(explicitBrowser)))throw Error('DSH_BROWSER_PATH 指向的浏览器不存在，请检查路径。');
const edgeCandidates=[process.env['ProgramFiles(x86)'],process.env.ProgramFiles,process.env.LOCALAPPDATA].filter(Boolean).map(base=>path.join(base,'Microsoft/Edge/Application/msedge.exe'));
const browserExecutable=explicitBrowser?path.resolve(explicitBrowser):edgeCandidates.find(file=>fs.existsSync(file));
module.exports={chromium,browserExecutable};
