# Credential commit prevention

Keep local secrets out of Git. The root ignore rules cover environment variants,
private-key file names and common local credential stores. Public certificates
and placeholder-only example/template files remain usable. Example names never
exempt their contents from checks.

Before committing, run:

```sh
python3 scripts/security/test_secret_guard.py
python3 scripts/security/check_secrets.py --staged
```

Use the same guard without `--staged` to inspect the entire Git index. It fails
if an already-tracked credential file is found, even when Git ignores that path.
Git ignore rules affect untracked files only; adding them does not remove an
existing tracked secret. The guard checks staged blob contents, so an unstaged
edit cannot conceal what will be committed. It prints locations and rule names,
never matching token text.

The separate **Secret checks** workflow runs for pushes and ordinary pull requests,
with read-only repository permission and no supplied credential. Existing product
tests remain separate. It runs the guard and a broader, pinned Gitleaks scan of
all history reachable in the checkout, including intermediate commits. Synthetic
positive controls and safe negative controls must pass before the history scan.
A temporary Git fixture must also reject a synthetic sentinel committed and
then removed from its current tree, and accept a clean synthetic history.
It does not upload findings as artifacts or transmit repository contents to a
scanner service. The scanner container has no network access during scans.

Scanner: Gitleaks **8.30.1**, official image
`ghcr.io/gitleaks/gitleaks:v8.30.1`, pinned digest
`sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`.
Upstream [release](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1),
[MIT license](https://github.com/gitleaks/gitleaks/blob/v8.30.1/LICENSE),
and [registry instructions](https://github.com/gitleaks/gitleaks#installing).
The maintainer currently accepts security patches and points new feature work
to a successor. Review future scanner/version changes before updating the pin.
The checkout action is pinned to its v4.3.1 commit.

No paid scanner service, scanner API key, or local scanner installation is required
for the guard. Private repositories may consume the account's normal GitHub
Actions allowance; this change does not enable any paid feature.

Both checks have limits. The small local pattern set is supplementary and misses
unknown credential formats and generic passwords. Gitleaks is also heuristic:
passing checks do not prove absence of secrets. Gitleaks' built-in exclusions
still apply; the index guard additionally checks its small pattern set in every
tracked blob, including binary formats. Untracked local files, deleted
remote refs, inaccessible history, production stores, and Actions settings are
outside this workflow's scope. No required-check branch rule is created here.

For a failure, inspect the location privately. If the value is a real exposed
credential, follow an explicitly authorized containment/rotation process.
If it is a synthetic false positive, prefer an obviously inert placeholder;
do not blanket-exclude examples, documentation, file types, or the scanner.
Changes to suppression policy require review.
