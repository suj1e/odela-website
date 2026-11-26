---
title: Getting started
description: Install a harness and create your first workspace.
---

## 1. Install an agent harness

odela does not bundle an agent runtime. Install OMP or Pi first and make sure it runs in a terminal.

## 2. Open odela

Add a workspace, choose a folder, and create a session.

## 3. Let the agent control tabs

```bash
odela --skills --json
odela browser open https://example.com
odela files reveal src/app.go
```

`--skills` prints the available semantic commands; agents call them through the shell instead of clicking coordinates.

## Next

- Send your first prompt in chat.
- Open the terminal, files or browser tab.
- Close and reopen the desktop; the session keeps running in core.
