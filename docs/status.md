# Current status — 0.1.0-alpha.5

KPI Kit is a public-alpha React dashboard source kit. The workbench is available in public GitHub source and the [live demo](https://chirpyworks.github.io/kpi-kit/). Release evidence recorded on 2026-09-30 is linked in [verification](verification.md).

Implemented:
- viewport-fit technical navy/light-blue workspace, distinct template/component modes, optional inspector and mobile panel tabs;
- three purposeful synthetic compositions: revenue, customers and operations;
- shared period filtering across each composition's metrics, trend, categories and detail rows;
- six KPI patterns and nine chart presentations with signed/zero/missing geometry;
- independently calculated mini trends, shared-scale prior-period overlays, data-derived callouts and target/outcome context;
- compact chart readouts with original current/prior labels, retained observation selection and real presentation controls;
- aligned analytical panels, semantic metric/target surfaces and reduced-motion-aware transitions;
- generic searchable/sortable/selectable/exportable table;
- reusable dashboard shell, page header, side navigation, breadcrumbs, detail panel and bounded pagination;
- validated inputs/selects, combined local filters, modal/confirmation, dismissible notifications and tooltip examples;
- loading/empty/no-results/error/offline/stale/partial states plus full 403/404/500/maintenance screens;
- 38 selectable component patterns/examples with focused live previews and matching reusable code;
- localized English/Korean UI, light/dark themes, explicit demo states;
- local KPI JSON import with metric selection and fixed-scope separation;
- self-contained copyable TSX examples, compiled in both locales;
- real reviewed npm lockfile and extended source/SSR/data/browser test coverage.

Verified and unverified checks are listed in [verification](verification.md). The recorded release passed production-build Chromium behavior checks and a bounded cloud-browser desktop review. Physical-device and broader accessibility/security limits remain explicit.

Not claimed:
- hosted BI service, arbitrary CSV/schema inference or authentication/backend services;
- a complete application design system or stable npm package;
- production data correctness beyond the declared synthetic adapter;
- universal security, accessibility or production readiness based only on the recorded checks.

Additional components should solve a clear analytical task with an explicit contract and meaningful tests.
