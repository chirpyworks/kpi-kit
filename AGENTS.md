# Public contributor guidance

This file is ordinary public project guidance, not a private agent runtime.

Read README.md and docs/status.md before changing scope. Keep KPI Kit a GitHub source kit; do not introduce subscriptions, accounts, paid APIs, or a hosted backend as hidden requirements.

Keep `src/kit` independent from `src/demo`. Preserve explicit units, scopes, missingness, quality, denominators, and polarity. A declared aggregation kind is metadata, not an automatic raw-data aggregator.

Run the real checks listed in CONTRIBUTING.md. Distinguish source checks, a Vite production build, browser checks, and remote CI. Do not invent a lockfile, pass badge, URL, release, test count, or reviewer.

Do not commit customer data, secrets, copied vendor runtimes, build outputs, or private operating instructions.
