# Contributing

KPI Kit is a GitHub-first open-source source kit. Keep changes focused on a demonstrated dashboard task.

Start with [README](README.md), [component map](docs/component-map.md), and [status](docs/status.md). Reproduce bugs with synthetic data and add a failing test before the fix where practical.

Before a pull request, run:

```sh
npm run check:repository
npm run typecheck
npm test
npm run build
npm run test:kit
```

Do not replace a failed real build with a saved preview. State exact commands and mark unrun checks as unrun.

`src/kit/core` owns pure validation/calculation/selection. `src/kit` UI consumes those contracts. `src/demo` is only the public workbench. Reusable components must not depend on demo fixtures.

For a new KPI, document unit, denominator, time scope, missing-data rule, aggregation semantics, and polarity. For a chart, document the comparison task and handling of zero, missing, and negative values. UI controls need visible labels, keyboard behavior, and relevant empty/error/cancel states.

Avoid new runtime dependencies until existing primitives are insufficient. Explain licensing and bundle trade-offs when adding one.

Do not commit customer data, credentials, generated build output, copied vendor runtimes, or private operating material.

By contributing, you confirm you can provide your change under this project's MIT License.
