from pathlib import Path
import hashlib,json,tarfile,zipfile
root=Path(__file__).resolve().parent.parent
out=root/'dist'
out.mkdir(parents=True,exist_ok=True)
(root/'.verification').mkdir(parents=True,exist_ok=True)
version=json.loads((root/'package.json').read_text(encoding='utf-8-sig'))['version']
tgz=out/f'dsh-bayern-home-{version}.tgz'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
with tarfile.open(tgz,'r:gz') as archive:
    names=archive.getnames()
    assert set(names)=={'package/LICENSE','package/NOTICE.md','package/README.md','package/cordis.patch.yml','package/lib/client.js','package/lib/index.js','package/package.json','package/INSTALL.md'}
    assert archive.extractfile('package/lib/client.js').read()==(root/'lib/client.js').read_bytes()
installer=out/f'拜仁主场-{version}-安装包.zip'
with zipfile.ZipFile(installer,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in [tgz,root/'install.ps1',root/'安装插件.cmd']:
        archive.write(p,p.name)
    archive.write(root/'README.md','安装说明.md')
    archive.writestr('SHA256SUMS.txt',sha(tgz)+'  '+tgz.name+'\n')
source=out/f'拜仁主场-{version}-源码与预览.zip'
files=['CHANGELOG.md','docs/images/matches.png','docs/images/work-assistant.png','docs/demos/card-exchange.webm','package.json','cordis.patch.yml','README.md','NOTICE.md','LICENSE','INSTALL.md','PUBLISH.md','.gitignore','.gitattributes','install.ps1','安装插件.cmd','打开预览.cmd',
'lib/index.js','lib/client.js','src/client.js','src/theme.css','src/data.mjs','src/studio.mjs','src/board-export.mjs','src/studio-ui.js','src/work.mjs','src/work-ui.js','src/lineup.json','src/reserves.json','assets/crest.png','assets/allianz-night.png','assets/allianz-day.png','assets/allianz-night.webp','assets/allianz-day.webp','assets/generation-prompts.json',
'scripts/verify-competitions.cjs','scripts/verify-regression-0.6.0.cjs','scripts/verify-backup-0.6.2.cjs','scripts/verify-focus-0.6.3.cjs','scripts/verify-navigation-0.6.4.cjs','scripts/verify-status-0.6.5.cjs','scripts/verify-season-0.6.7.cjs','scripts/verify-compact-0.7.0.cjs','scripts/verify-context-0.7.3.cjs','scripts/verify-profile-fold-0.7.4.cjs','scripts/verify-settings-0.7.5.cjs','scripts/verify-discussion-0.7.6.cjs','scripts/verify-card-lineup-0.12.0.cjs','scripts/verify-card-swap.cjs','scripts/verify-bench.cjs','scripts/bench.test.mjs','scripts/work.test.mjs','scripts/verify-work.cjs','scripts/verify-work-snapshots.cjs','scripts/verify-work-commands.cjs','scripts/verify-work-backup.cjs','scripts/verify-work-input.cjs','scripts/verify-work-paste.cjs','scripts/verify-work-todos.cjs','scripts/verify-ui.cjs','scripts/browser-runtime.cjs','scripts/ui-navigation.cjs','scripts/build.mjs','scripts/data.test.mjs','scripts/studio.test.mjs','scripts/serve.cjs','scripts/prepare-release.py','tools/preview.html','tools/vendor/react.production.min.js','tools/vendor/react-dom.production.min.js','tools/vendor/LICENSE.react.txt','docs/images/dark.png','docs/images/light.png','docs/images/lineup-dark.png','docs/images/lineup-light.png']
files += [p['photo'] for p in json.loads((root/'src/lineup.json').read_text(encoding='utf-8'))['players']]
files += [p['photo'] for p in json.loads((root/'src/reserves.json').read_text(encoding='utf-8'))['players'] if p.get('photo')]
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for name in files:
        archive.write(root/name,'dsh-bayern-home/'+name)
    archive.write(tgz,'dsh-bayern-home/dist/'+tgz.name)
for p in [installer,source]:
    with zipfile.ZipFile(p) as archive:assert archive.testzip() is None
artifacts=[tgz,installer,source]
(out/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in artifacts),encoding='utf-8')
result={'version':version,'tarballVerified':True,'zipIntegrityVerified':True,'artifacts':[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)} for p in artifacts]}
(root/'.verification'/'release-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
