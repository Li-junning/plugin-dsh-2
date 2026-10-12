param([string]$HarnessFolder = '', [string]$Profile = 'desktop')
$ErrorActionPreference = 'Stop'
$taskPackageName = 'dsh-bayern-home-0.2.0.tgz'
$taskPackage = Join-Path $PSScriptRoot $taskPackageName
if (-not (Test-Path -LiteralPath $taskPackage)) { $taskPackage = Join-Path $PSScriptRoot ('dist\' + $taskPackageName) }
if (-not (Test-Path -LiteralPath $taskPackage)) { throw '未找到插件安装包，请完整解压安装 ZIP。' }
$taskCandidates = @()
if ($HarnessFolder) { $taskCandidates += $HarnessFolder }
foreach ($taskRegistryRoot in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
    foreach ($taskEntry in @(Get-ItemProperty -Path ($taskRegistryRoot + '\*') -ErrorAction SilentlyContinue)) {
        if ($taskEntry.DisplayName -match 'DeepSeek\s*Harness|DSH\s*Desktop') {
            if ($taskEntry.InstallLocation) { $taskCandidates += $taskEntry.InstallLocation }
            if ($taskEntry.DisplayIcon) {
                $taskIcon = ($taskEntry.DisplayIcon -replace ',\d+$','').Trim('"')
                if (Test-Path -LiteralPath $taskIcon -PathType Leaf) { $taskCandidates += Split-Path -LiteralPath $taskIcon }
            }
        }
    }
}
foreach ($taskBase in @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)})) {
    if ($taskBase) { $taskCandidates += (Join-Path $taskBase 'Programs\DeepSeek Harness'), (Join-Path $taskBase 'DeepSeek Harness'), (Join-Path $taskBase 'DSH Desktop') }
}
$taskCli = $null
foreach ($taskCandidate in $taskCandidates) {
    $taskProbe = Join-Path $taskCandidate 'resources\runtime\cli\bin\dsh.cmd'
    if (Test-Path -LiteralPath $taskProbe) { $taskCli = $taskProbe; break }
}
if (-not $taskCli) {
    $HarnessFolder = (Read-Host '请输入 DeepSeek Harness.exe 所在文件夹').Trim('"')
    if (Test-Path -LiteralPath $HarnessFolder -PathType Leaf) { $HarnessFolder = Split-Path -LiteralPath $HarnessFolder }
    $taskCli = Join-Path $HarnessFolder 'resources\runtime\cli\bin\dsh.cmd'
}
if (-not (Test-Path -LiteralPath $taskCli)) { throw '未找到 DSH 随附 CLI，请核对安装目录。' }
if (@(Get-Process -Name 'DeepSeek Harness','DSH Desktop' -ErrorAction SilentlyContinue).Count -gt 0) { throw '请先保存工作并完整退出 DeepSeek Harness，再运行安装。' }
Write-Host '正在安装拜仁主场 0.2.0…'
& $taskCli plugin --profile $Profile add $taskPackage --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "安装失败，退出码 $LASTEXITCODE。请保留上面的错误信息。" }
Write-Host '安装完成。重新打开 DSH，鼠标移到右侧细红条即可展开工具。'
