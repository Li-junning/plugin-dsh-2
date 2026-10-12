# 拜仁主场 · DeepSeek Harness 插件

让每一次对话，都像回到主场。非官方拜仁球迷主题，为 DSH 带来安联球场、队旗与球员背景，以及赛程、比分和战术工具。

**当前版本：0.2.0** · 已在 Windows / DeepSeek Harness Desktop **0.2.0-rc.2** 验证安装及真实前端加载。其他 DSH 版本尚未验证。

![夜场预览](docs/images/dark.png)

<details><summary>查看浅色版：同一构图，不同光线</summary>

![日场预览](docs/images/light.png)

</details>

## 下载与安装

### 直接下载安装包（Windows）

1. 到 [最新 Release](https://github.com/Li-junning/plugin-dsh-2/releases/latest) 下载 `dsh-bayern-home-0.2.0-windows.zip`。
2. 解压到任意文件夹，保存工作并完整退出 DeepSeek Harness。
3. 双击 `安装插件.cmd`。脚本会尝试寻找 DSH；找不到时，按提示输入 **DeepSeek Harness.exe 所在文件夹**。
4. 安装完成后重新打开 DSH。鼠标移到右侧细红条展开工具，右上角「我的主场」打开完整面板。

需先安装 DeepSeek Harness；插件安装包不包含宿主应用。

### 从 GitHub 直接安装

如果 `dsh` 已在 PATH 中：

```powershell
dsh plugin --profile desktop add "github:Li-junning/plugin-dsh-2#v0.2.0" --ignore-scripts
```

也可以通过 DSH 桌面版随附的 CLI 安装：

```powershell
$harnessFolder = Read-Host "请输入 DeepSeek Harness.exe 所在文件夹"
$dsh = Join-Path $harnessFolder "resources\runtime\cli\bin\dsh.cmd"
& $dsh plugin --profile desktop add "github:Li-junning/plugin-dsh-2#v0.2.0" --ignore-scripts
```

`#v0.2.0` 固定发行版本；去掉标签可安装 main 分支。仓库根目录包含完整 `package.json`、`cordis.patch.yml` 和预构建 `lib/`，安装无需自行构建，也无需额外模型密钥或足球 API Key。

完整说明、离线 tgz 安装与卸载方法见 [INSTALL.md](INSTALL.md)。

## 外观与功能

- **同一主场，两种光线**：深浅主题自动跟随系统应用颜色模式。保留右侧队旗和一名红衣球员；球场门前的远处人群已去掉。
- **隐藏式工具栏**：平时只留细红条，悬停展开三个入口，移开后收起；不推动对话布局。支持 Tab 聚焦、Esc 收起和触屏点击。
- **玻璃质感界面**：统一线性图标、圆角、浮动面板与比赛卡片。输入框样式通过 DSH 的原生语义属性生效。
- **赛程与比分**：通过 OpenLigaDB 读取德甲赛程、比赛状态与数据源记录的比分；支持手动刷新、赛季切换、北京时间和慕尼黑时间。
- **封存赛果**：默认隐藏面板里的所有比分，需要时手动揭晓。
- **比赛日历**：未来且时间已确认的比赛可导出 ICS，支持提前 15 / 30 / 60 / 120 分钟提醒，导入日历应用后生效。
- **战术灵感**：4-2-3-1 / 4-3-3 通用阵型图，把话题追加到当前未发送草稿，由你配置的模型接着讨论；不会自动发送消息。
- **专注阅读**：一键隐藏背景；背景浓度、时区、提醒等偏好保存在本机。

内置赛程覆盖德甲，欧冠和德国杯可通过面板里的官方全赛事赛程查看。OpenLigaDB 是社区数据，比分可能延迟；开球时间已过不代表数据源确认正在直播。离线日历不会自动同步赛程改期。

## 隐私与兼容性

背景、样式和队徽均内嵌在正式客户端。查看比赛时直接访问 OpenLigaDB，不传送 DSH 对话、模型密钥或账号信息。分发包不包含本机 profile、日志、缓存或账号数据。

本插件与 `dsh-bayern-boot` 拜仁启动动画插件分别安装。不会修改或自动停用其他插件；如宿主报告某个旧插件不兼容，请通过 DSH 插件管理器处理该旧插件。

## 预览与开发

下载仓库源码后，双击 `打开预览.cmd` 或打开 `tools/preview.html`。预览使用正式插件客户端，DSH 外壳为模拟布局；发送预览消息不会调用模型。离线预览中的 React / ReactDOM 仅用于演示，不属于正式插件运行依赖。

修改源码后，用 Node.js 20 或更新版本运行：

```sh
npm test
npm run build
npm run pack
```

本插件没有 npm 运行依赖；无需 `npm install` 即可执行以上构建与数据测试。也可执行 `npm run preview`，在终端显示的本地 URL 预览。

发布维护说明见 [PUBLISH.md](PUBLISH.md)。

## 许可与素材

代码采用 [MIT License](LICENSE)。拜仁名称及队徽归原权利人所有，本项目为非官方球迷作品，代码许可不授予俱乐部商标的权利。背景由 AI 创作，并非球场实拍。第三方说明见 [NOTICE.md](NOTICE.md)。

参考：[DSH 官方打包安装文档](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)、[DSH Slots](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/slots)、[OpenLigaDB](https://github.com/OpenLigaDB/OpenLigaDB-Samples)。
