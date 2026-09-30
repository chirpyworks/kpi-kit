# KPI Kit

**An open-source React kit for KPI patterns, charts, tables, filters, and data states — designed to be customized without losing the meaning of the numbers.**

[한국어](README.ko.md) · [Component map](docs/component-map.md) · [Data contract](docs/kit-contract.md) · [Usage](docs/kit-usage.md) · [Status](docs/status.md)

> **0.1.0-alpha.5 — public alpha candidate.** The source is intentionally honest about its release state. A clean install, generated lockfile, full TypeScript check, Vite production build, and browser verification are run by the repository workflow before this revision is treated as publishable alpha evidence. Stable-release language requires an additional reviewed lockfile and green verification on `main`.

## Why this exists

Most dashboard starters solve the screenshot first. KPI Kit starts with the reusable decision surface:

**scope → KPI meaning → comparison → visualization → detailed evidence → data state**

The goal is not to be a BI platform. It is a source kit that makes common dashboard work fast while keeping units, comparison bases, missingness, freshness, and target semantics explicit.

No account, backend, database, API key, telemetry, or paid service is required. The checked-in examples are synthetic.

## Included

| Surface | Alpha.5 |
| --- | --- |
| KPI | One `MetricCard` with six patterns: number, comparison, sparkline, target, status, compact |
| Charts | Line, area, horizontal bar, vertical bar, grouped bar, stacked bar, waterfall, donut, bullet |
| Table | Typed columns, search, stable sorting, pagination, row/page selection, filtered CSV, selected-row CSV |
| Controls | Button, Badge, Field, Checkbox, Switch, FilterChip, Tabs, Tooltip, DateRangeField, Dialog |
| States | Loading, empty, error, partial coverage, stale data |
| Data | Validated metric contract, explicit scope/unit/quality, safe comparisons, latest-result async loader |
| Workbench | English/Korean, light/dark, local KPI JSON import, component/code inspection |

The nine chart entries are **presentations**, not nine unrelated chart engines. Line/area share one series renderer; grouped/stacked bars share one multi-series contract.

## Run locally

Requirements: Node 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the Vite URL. `/index.html` is the full workbench; `/kit.html` is a direct component-workbench entry.

A real first install generates `package-lock.json`. Review and commit that lockfile before relying on `npm ci` for reproducible installs. This repository does not fabricate a lockfile.

## Use a KPI component

```tsx
import { MetricCard, validateMetricView } from './kit/index.js';
import './kit/styles.css';

const metric = validateMetricView(rawMetric);

export function Overview() {
  return (
    <section className="kk-root">
      <MetricCard metric={metric} pattern="comparison" />
    </section>
  );
}
```

The display component does not infer a KPI from arbitrary raw rows. Your adapter owns the business calculation; KPI Kit validates and presents the result.

## Data rules that stay visible

- **Missing is not zero.**
- **Partial coverage is not a complete total.**
- **Freshness and completeness are separate.**
- **Percentage-point change is not relative percent change.**
- **A zero baseline does not become infinity.**
- **Target attainment is not the same as improvement versus a previous period.**
- **A decrease can be positive when lower is better.**
- **Line/area gaps remain gaps.**
- **Stacked negative values are rejected rather than rendered ambiguously.**
- **A waterfall does not invent a closing value when a movement is missing.**

Read the [data contract](docs/kit-contract.md) for the precise boundaries.

## Verify changes

```sh
npm run typecheck:core
npm run typecheck:kit
npm test
npm run check:repository
npm run verify
```

Browser verification requires Python and Playwright:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:kit
```

The GitHub workflow performs the clean-install path on the public repository and keeps technical evidence as a short-lived artifact. It does **not** deploy a site or publish an npm package.

## Project layout

```text
src/kit/          reusable contracts, logic, UI and styles
src/demo/         public component workbench
public/examples/  synthetic startup data
examples/         small integration examples
tests/            core and browser verification
docs/             contracts, component map, design and release notes
```

## Scope

KPI Kit is not a hosted analytics service, an accounting ledger, an authentication layer, or a complete application design system. It is GitHub source under the MIT License.

`package.json` remains `private: true` to prevent accidental npm publication. That flag does not restrict the MIT-licensed source code.

Do not put credentials or real customer records in `public/`, source files, screenshots, issues, or test fixtures.

## Contributing

Focused issues and pull requests are welcome. Read [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md), [third-party notices](THIRD_PARTY_NOTICES.md), and the [MIT license](LICENSE).
