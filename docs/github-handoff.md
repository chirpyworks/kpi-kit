# GitHub publication handoff

This repository is the public home for KPI Kit. Keep source at repository root and preserve the MIT license, examples, tests and contribution guidance. Do not commit local diagnostic runtimes, `node_modules`, `dist`, `.test-build`, private work records, secrets or customer data.

The **Bootstrap technical verification** workflow runs on pull requests, pushes to `main`, and manual `workflow_dispatch`. It uses a standard GitHub-hosted Ubuntu runner with read-only repository permissions; it does not deploy, publish npm packages or create paid resources.

When no lockfile exists, the workflow performs a real `npm install`, then runs the release verification sequence and uploads the generated `package-lock.json` plus logs as an artifact. Review that lockfile and commit it before treating installs as reproducible. Subsequent verification should use `npm ci`.

Before a stable tag: resolve every blocking install/type/test/build error, verify advertised commands, test `src/kit` in a separate consumer app, inspect current desktop/mobile renders, review dependency notices and audit results, and keep unsupported inputs visible in documentation. A truthful alpha source release is not a claim that the broader component catalogue is complete.
