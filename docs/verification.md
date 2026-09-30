# Verification — public workbench alpha

## Recorded release evidence (2026-09-30, 15:04 UTC)

The runtime source was verified on candidate `5cca5f34b422c5dc38f6c0e1cf0084c0af504563`, then merged as `e312fc2f82e961863bcf85c03cf0ac685475348f`. Both commits have the same source tree, `a1ff0a61d3516d9fb56a35445fa99eb2157cd1bb`.

- [Candidate CI passed](https://github.com/chirpyworks/kpi-kit/actions/runs/36732343331)
- [Merged-main CI passed](https://github.com/chirpyworks/kpi-kit/actions/runs/36732880660)
- [GitHub Pages deployment passed](https://github.com/chirpyworks/kpi-kit/actions/runs/36732880597)
- [Public demo](https://chirpyworks.github.io/kpi-kit/) opened after deployment in a cloud browser; desktop layout, exact-label component selection, dialog open/close, Korean locale and dashboard navigation were checked

These are revision-specific results, not promises about future commits. This documentation update records that verified release; it does not change the runtime.

## Passed checks

- Genuine lockfile followed by fresh `npm ci`; lockfile v3 resolved package URLs use registry.npmjs.org
- Repository hygiene, full TypeScript checks and Vite production builds for both entry points
- 202 unit, calculation, source and React server-rendered tests
- Generated English/Korean TSX examples compile against actual exported components
- Real Chromium production-build behavior: desktop and mobile layouts, filters, three compositions, chart/code parity, signed geometry, table CSV, imported metric selection, state recovery, dialogs, locales and theme
- `npm audit`: zero reported vulnerabilities during the recorded CI runs
- Separate copied-kit consumer TypeScript, production-build and SSR checks using the existing installed toolchain; no demo source was required
- Complete project and React/React DOM/Scheduler MIT notices retained in build output and portable HTML
- Targeted source/security checks for credential/private-content leakage, bounded JSON import, CSV formula-prefix handling and unsafe breadcrumb URL rejection

The browser suite runs against the actual Vite production output, not a saved mockup. Diagnostic screenshots and logs are short-lived GitHub Actions artifacts. The absence of reported dependency vulnerabilities is a point-in-time result, not a security guarantee.

## Important coverage

The workbench includes 22 navigation/control/state/page examples in English and Korean, with 44 independently compilable localized modules. Tests cover invalid fields, dismissal without saving, confirmation cancellation/acceptance, filtering/no-results, denied access, retry success/re-failure, retained partial/stale evidence and pagination bounds.

Chart/data tests preserve units, original current/prior labels, per-KPI trend semantics, missing observations, signed/zero geometry, unavailable comparisons and neutral target assessment under partial coverage. Comparison series share a scale and preserve original dates. Examples use synthetic data only.

Both HTML entry points and the standalone builder require a single zoomable `width=device-width, initial-scale=1` viewport. Automated browser contexts include 360/390px mobile widths with touch/device scale, and 360/390/768/980/1100px layout checks. Compact panels apply through 1100 CSS pixels; desktop checks cover wider compositions. These are browser-emulation checks, not physical-device testing.

## Remaining limits

- Physical phones/tablets, Safari/WebKit, Firefox and assistive-technology combinations have not been comprehensively tested
- Automated browser assertions and a bounded cloud-browser desktop review are not a complete usability or accessibility audit
- No comprehensive external penetration test, security certification or production-data validation is claimed
- Copied-kit integration reused the installed toolchain; it was not an additional independent clean installation
- This is a public alpha source kit, not a stable npm package or hosted analytics/backend service

## Reproduce

```sh
npm ci
npm run verify
python -m pip install -r tests/requirements.txt
python -m playwright install --with-deps chromium
npm run test:kit
npm audit
npm run build:standalone
```

`npm run verify:release` runs the clean-install, source, production-browser and dependency-audit sequence. See the [release checklist](release-checklist.md) before making broader release claims.

## Distribution safeguards

The build retains full project and bundled runtime MIT notices in `dist/LICENSES.txt` and the project license in `dist/LICENSE`; portable HTML embeds the same notices. Source archives contain tracked source only, excluding build output, local artifacts and dependency directories. Pages build jobs have read-only repository permissions; configuration/deployment steps and deployment-only permissions are scoped to the deploy job. Caller-provided breadcrumb URLs are validated before rendering.
