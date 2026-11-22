---
date: 2026-11-22
slug: sandbox-node-modules-are-windows-only
type: lesson
status: active
tags: [tooling, sandbox, tests]
---

# The mounted `node_modules` is Windows-only

In the Linux sandbox the repo's `basalt-app/node_modules` holds only `win32` native binaries (esbuild, rollup) and no `node` is installed. Running `npm ci` there would overwrite the host's dependencies.

Do instead: `sudo apt-get install -y nodejs-24 npm`, copy the repo without `node_modules`, `target` and `.git` into the scratchpad (`tar --exclude`), run `npm ci` and `npx playwright install --with-deps chromium` there, and copy changed files over before each test run. Prettier reports every file there as unformatted (CRLF); format only the files you touched.
