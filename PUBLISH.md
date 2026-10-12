# 发布维护

仓库：https://github.com/Li-junning/plugin-dsh-2

正式客户端 lib/client.js 必须随源码提交。GitHub 安装不会依赖 prepare、install 或 postinstall 脚本，也不需要运行构建。

1. 修改 src/ 或 assets/，同步更新 package.json 的版本和安装说明。
2. 执行 `npm test`、`npm run build`、`npm run pack`。
3. 确认 npm 包只包含发布清单中的 lib/、清单、说明及许可。
4. 将源码与预构建 lib/ 提交到 main，为该提交创建 v版本号 标签。
5. 创建对应 GitHub Release，上传 tgz、Windows 安装 ZIP 和 SHA256SUMS.txt。安装 ZIP 包含 tgz、install.ps1、安装插件.cmd 与安装说明。
6. 下载公开发行包核对 SHA256，并验证标签中的 package.json 与 lib/client.js。

只发布明确列入清单的源码、素材、离线预览和设计演示图。不要上传 .runtime/、.verification/、本机安装记录、DSH profile、凭据、账号数据、日志或旧版分发包。

private: true 防止误发布到 npm，不影响公开 GitHub 仓库、GitHub 安装或 tgz 安装。
