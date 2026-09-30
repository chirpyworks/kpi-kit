# Third-party notices

KPI Kit source is provided under the [MIT License](LICENSE).

## Bundled runtime dependencies

The committed `package-lock.json` records the installed dependency graph. Production builds bundle React 18.2.0, React DOM 18.2.0 and Scheduler 0.23.2, each under MIT. Their complete upstream copyright and permission notices are read from the installed packages during `npm run build` and preserved with the project license in `dist/LICENSES.txt`. The project license is also copied to `dist/LICENSE`. `npm run build:standalone` embeds those same full notices in the portable HTML preview.

When copying `src/kit` into another application, preserve the project LICENSE and the licenses of dependencies distributed with your application. When changing runtime dependencies, update the lockfile and the explicit runtime notice inventory in `scripts/stamp-build.mjs`.

## Development and test tools

TypeScript, Vite, Playwright, type declarations and their transitive dependencies are development/test tools with their own licenses. Their upstream package notices remain applicable. This file is not an independently audited software bill of materials.

No copied reference screenshot, third-party font or external illustration is included in the source. The chart renderers and UI examples are authored project source. Names and data in examples are synthetic, not customer references.
