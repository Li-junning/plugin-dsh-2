# 安装拜仁主场 0.18.0

## Windows 安装包

1. 先安装并运行过 DeepSeek Harness Desktop。
2. 从 [v0.18.0 Release](https://github.com/Li-junning/plugin-dsh-2/releases/tag/v0.18.0) 下载 `dsh-bayern-home-0.18.0-windows.zip` 并完整解压。
3. 保存工作并完整退出 DSH。
4. 双击 `安装插件.cmd`；找不到 DSH 时按提示输入程序所在文件夹。
5. 安装成功后重新打开 DSH。

本包不含 DSH 主程序。安装脚本调用 DSH 随附 CLI，安装同目录的 `dsh-bayern-home-0.18.0.tgz`；不会关闭应用或修改模型配置。

## GitHub 命令安装

```powershell
dsh plugin --profile desktop add "github:Li-junning/plugin-dsh-2#v0.18.0" --ignore-scripts
```

桌面版随附 CLI 为安装目录下的 `resources/runtime/cli/bin/dsh.cmd`。如果该命令未在 PATH 中，使用完整 CLI 路径执行同样参数。

## 本地 tgz 安装

```powershell
dsh plugin --profile desktop add ".\dsh-bayern-home-0.18.0.tgz" --ignore-scripts
```

使用其他配置时将 `desktop` 替换成对应名称。更新保留本机设置与用户数据；建议先在主场设置及工作助手中分别导出备份。

卸载可在 DSH 插件管理器中操作。

## 数据与验证

覆盖拜仁德甲、欧冠和德国杯；后续对阵随数据源更新。球员为附核对日期的参考资料，不是实时首发。

0.18.0 通过 86 项单元测试、124 项界面检查及包校验；真实宿主冷启动尚未重验。其他宿主版本的兼容性请以实际运行情况为准。
