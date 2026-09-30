# Release checklist

For public alpha source:
- intended repository and MIT license are present;
- README, contribution, security and issue/PR guidance are present;
- synthetic data and current limitations are clearly labeled;
- no local build outputs, private work records or secrets are committed.

Before a stable release:
- review and commit a genuine lockfile from a successful clean install;
- pass `npm ci`, full TypeScript checks, unit tests and both Vite entry points;
- pass current production-build browser tests;
- review dependency notices and audit results;
- verify the reusable kit in a separate consumer app;
- inspect keyboard, mobile and accessibility behavior;
- keep version, changelog, README and source consistent.

Technical verification is not a substitute for an independent security or usability review.
