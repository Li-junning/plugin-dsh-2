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
files=['package.json','cordis.patch.yml','README.md','NOTICE.md','LICENSE','INSTALL.md','PUBLISH.md','.gitignore','.gitattributes','install.ps1','安装插件.cmd','打开预览.cmd',
'lib/index.js','lib/client.js','src/client.js','src/theme.css','src/data.mjs','assets/crest.png','assets/allianz-night.png','assets/allianz-day.png','assets/allianz-night.webp','assets/allianz-day.webp','assets/generation-prompts.json',
'scripts/build.mjs','scripts/data.test.mjs','scripts/serve.cjs','scripts/prepare-release.py','tools/preview.html','tools/vendor/react.production.min.js','tools/vendor/react-dom.production.min.js','tools/vendor/LICENSE.react.txt','docs/images/dark.png','docs/images/light.png']
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
