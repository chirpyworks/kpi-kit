# Current status — 0.1.0-alpha.5

KPI Kit is a public-alpha React dashboard source kit. The workbench upgrade is a local, reviewable implementation; public main/deployment status is separate.

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

Verified and unverified checks are listed in [verification](verification.md). Browser test code exists, but a passing run and rendered visual review on this revision are not yet established.

Not claimed:
- hosted BI service, arbitrary CSV/schema inference or authentication/backend services;
- a complete application design system or stable npm package;
- production data correctness beyond the declared synthetic adapter;
- published/merged/deployed changes merely because local tests pass.

Additional components should solve a clear analytical task with an explicit contract and meaningful tests.
