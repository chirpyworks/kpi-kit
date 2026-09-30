# Current status — 0.1.0-alpha.5

KPI Kit is a public-alpha candidate for an open-source React dashboard source kit.

Implemented:
- six KPI presentation patterns;
- nine chart presentations;
- generic searchable/sortable/selectable/exportable table;
- analysis-oriented controls and dashboard states;
- English/Korean workbench with light/dark themes;
- local synthetic KPI import;
- source hygiene, core and browser verification.

Not claimed:
- hosted BI service;
- arbitrary CSV/schema inference;
- authentication/backend services;
- a complete application design system;
- stable npm package publication.

The technical release gate is a real clean install, reviewed lockfile, full TypeScript check, Vite production build, core tests, and browser checks on the exact public commit.

Additional components should be added only when they solve a clear analytical task with an explicit data contract and tests.
