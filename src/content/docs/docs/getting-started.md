---
title: 快速开始
description: 安装 harness，创建第一个 workspace。
---

## 1. 安装 agent harness

odela 不内置 agent runtime。先安装 OMP 或 Pi，并确认它们能在终端运行。

## 2. 打开 odela

启动桌面端后，添加一个 workspace，选择文件夹，并创建一个 session。

## 3. 让 agent 控制 pane

```bash
odela --skills --json
odela browser open https://example.com
odela files reveal src/app.go
```

`--skills` 输出当前可用的语义命令；agent 通过 shell 调用，不需要坐标点击。

## 下一步

- 在 chat 里发第一条 prompt。
- 打开 terminal、files 或 browser pane。
- 关闭桌面后重新打开，确认 session 仍在 core 中运行。
