# 安装拜仁主场 0.5.2

## Windows 安装包

1. 先安装并运行过 DeepSeek Harness，再保存工作、完整退出应用。
2. 从 [v0.5.2 Release](https://github.com/Li-junning/plugin-dsh-2/releases/tag/v0.5.2) 下载并解压 `dsh-bayern-home-0.5.2-windows.zip`。
3. 双击 `安装插件.cmd`，必要时输入 DeepSeek Harness.exe 所在文件夹。
4. 安装成功后重新打开 DSH。

安装默认使用 desktop 配置。若你使用其他配置，可以执行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Profile "你的配置名称"
```

脚本只调用 DSH 随附 CLI 安装本地 tgz，不会关闭应用、修改模型配置、接受兼容性豁免或停用其他插件。

## GitHub 安装

保存工作并完整退出 DSH 后执行以下命令更新到 v0.5.2，再重新打开应用：

```powershell
dsh plugin --profile desktop add "github:Li-junning/plugin-dsh-2#v0.5.2" --ignore-scripts
```

桌面版也可以找到安装目录后，使用 `resources\runtime\cli\bin\dsh.cmd` 代替上面的 `dsh`。

安装前完整退出 DSH，完成后重新打开。如果网络无法访问 GitHub，请使用 Releases 的 Windows ZIP 或 tgz 本地安装方式。

## 本地 tgz

使用本地或 Release 中的 `dsh-bayern-home-0.5.2.tgz` 后，在文件所在目录运行：

```powershell
dsh plugin --profile desktop add ".\dsh-bayern-home-0.5.2.tgz" --ignore-scripts
```

## 卸载

```powershell
dsh plugin --profile desktop remove dsh-bayern-home
```

卸载后重新打开 DSH。插件保存在浏览器本机存储中的偏好、阵型与名片不会主动删除。

## 确认安装

新会话中应出现球场背景、拜仁队徽和右上角「我的主场」。鼠标移到右侧细红条，赛程与比分、战术灵感、专注阅读三个工具应展开，并可通过图钉固定。主场入口旁应有可隐藏的迷你比赛卡。面板中的「战术」「名片」「布局」分别提供编辑战术板、PNG 名片和布局定制。已有对话的背景会自动减弱；专注阅读开启时背景会隐藏。

目前验证宿主为 Windows DeepSeek Harness Desktop 0.2.0-rc.2。若宿主报告其他旧插件不兼容，请处理提示中点名的插件；本安装器不会替你接受风险豁免。
