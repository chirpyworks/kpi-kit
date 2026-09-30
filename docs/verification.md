# Verification — workbench upgrade

## Locally verified (2026-09-30)

- Real npm install produced the lockfile, followed by successful clean `npm ci`
- Lockfile v3: all resolved package URLs use registry.npmjs.org
- Full TypeScript checks and Vite production builds for both entry points
- Pure data/calculation tests and React server-rendered chart geometry/accessibility assertions
- Generated TSX examples compile against actual exported components in English and Korean; per-KPI mini-trend values retain their native units
- Python browser-test source compiles; repository hygiene and whitespace checks
- `npm audit`: zero reported vulnerabilities at the time of this check

All 77 tests from the earlier functional/visual upgrades are retained; the current suite has 202 passing tests. The original eight core tests are retained. New tests cover signed/zero/missing chart geometry, small values, same-source date filtering, ratio denominators, snapshot aggregation, unavailable comparisons, localization and executable snippets.

## Not yet verified on this revision

- Production browser behavior suite and rendered visual acceptance
- Desktop and phone screenshots, keyboard/focus behavior in an actual browser
- Remote GitHub CI on these changes, public deployment or release

A successful production browser run and visual review are required separately from the source checks recorded here. The expanded `tests/kit_browser.py` checks viewport containment, linked date filtering, composed domains, chart/code parity, signed geometry, CSV export, imported metric selection, dialog/locale/theme behavior and mobile panels when run in an available Chromium environment.

## Reproduce

```sh
npm ci
npm run verify
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:kit
npm audit
```

GitHub CI remains the gate for the exact proposed public revision. Passing code checks does not certify visual quality, all browser engines, real-device accessibility, security or adoption. Stable-release language remains blocked until the complete release checklist is satisfied.

## Assembly coverage checks

The 22 added navigation/control/state/page examples render in English and Korean. Every selected example emits an independently compilable TSX module (44 localized modules). Focused parity tests compare copied reducers and rendered outputs with live demo implementations. Coverage includes invalid form fields, saved-snapshot preservation on dismissal, confirmation cancellation vs acceptance, combined filtering/no-results, denied access, local retry success/re-failure, retained partial/stale evidence, and pagination bounds. These checks remain non-browser evidence; runtime focus, pointer behavior and rendered acceptance are still pending.

## Responsive preview safeguards

Both HTML entry points and the standalone builder require a single zoomable `width=device-width, initial-scale=1` viewport in the document head. Five source/build regression tests cover preservation, rejected fixed-width/missing/duplicate metadata, and the compact panel contract. The compact shell now applies through 1100 CSS pixels, including a 980px narrow-layout case; the 1280px/1440px desktop composition is unchanged. Phone-width metric specimens use a bounded grid and two-column pattern selection.

Browser-test source now includes 360/390px mobile browser contexts with touch and a device scale factor, in addition to 360/390/768/980/1100px layout checks. These browser assertions are not a passing runtime result. Compact-mode changes and source checks do not substitute for physical-device viewport validation.

## Copied-kit consumer check

A separate temporary React app copied only `src/kit` and imported its public `index.js` exports plus `styles.css`. It composed `MetricCard`, `SeriesChart`, `DataTable`, `AsyncState` and `ErrorPage` with synthetic data. Its TypeScript check, Vite production build (28 modules) and SSR smoke check passed, including a validated +25% comparison. No demo source was copied or imported. This used the existing installed dependency toolchain through a `node_modules` symlink; it was not an additional clean install or a rendered browser check.

## React craft verification

The refinement retains the complete earlier suite and adds eight focused chart regressions plus eleven composed-dashboard checks. They cover compact external values/units, original prior-period labels, pointer/keyboard callback transitions, missing-point selection, stale keyed selection, all three localized compositions, semantic sparkline tone, unavailable comparisons, neutral target assessment under partial coverage, aligned-grid source rules and reduced-motion guards. Full TypeScript, 202 tests, production build and standalone generation passed. New browser-test assertions for chart presentation and observation selection exist but were not run.

An independent source review identified a green target bar under unknown/partial assessment; it was corrected to a neutral tone and regression-tested. The separately copied-kit consumer was rebuilt against the final 20 kit files: typecheck, production build, SSR and no-demo dependency/bundle checks passed with the shared existing toolchain. Additional copied-kit compact-chart SSR cases covered EN/KO, interactive/static controls, signed prior values, zero and missing points. This is source/integration evidence, not native browser focus, touch or pixel acceptance.

## Public distribution safeguards

The build retains the full project and bundled React/React DOM/Scheduler MIT notices in `dist/LICENSES.txt`; portable HTML embeds the same notices. The source archive contains tracked source only, excluding build output, local artifacts and dependency directories. Pages build jobs have read-only repository permissions; deployment-only permissions are scoped to the deploy job. Caller-provided navigation URLs are validated before rendering. These checks reduce specific risks and do not constitute a universal security guarantee.
