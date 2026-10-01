#!/usr/bin/env python3
"""Small offline index guard; supplements, never replaces, a secret scanner."""
import argparse
import fnmatch
import os
from pathlib import PurePosixPath
import re
import subprocess
import sys

PATTERNS = (
    ("github-token", re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b")),
    ("openai-token", re.compile(rb"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b")),
    ("aws-access-id", re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("private-key", re.compile(rb"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----")),
    ("slack-token", re.compile(rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b")),
)
BLOCKED_NAMES = (
    ".env", ".env.*", ".envrc", "secrets.local.*", "*.key", "*.p12",
    "*.pfx", "*.jks", "*.keystore", "*.private.pem", "*-private.pem",
    "private-key*.pem", "privkey*.pem", "*-key.pem", "*_key.pem", "key.pem",
    "private.pem", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519",
    ".netrc", "_netrc", ".git-credentials", ".npmrc.local", ".pypirc",
    "credentials.json", "service-account*.json", "*_credentials.json",
)
BLOCKED_STORES = (
    ".aws/credentials", ".aws/config", ".docker/config.json",
    ".config/gcloud/application_default_credentials.json", ".config/gh/hosts.yml",
)

def safe_example(name):
    if name.startswith(".env.") and name.rsplit(".", 1)[-1] in ("example", "template", "sample"):
        return True
    return (
        name in ("credentials.example.json", "credentials.template.json")
        or (name.startswith("service-account") and name.endswith((".example.json", ".template.json")))
        or name.endswith(("_credentials.example.json", "_credentials.template.json"))
    )

def forbidden_path(path):
    normalized = str(PurePosixPath(path))
    parts = PurePosixPath(normalized).parts
    name = parts[-1]
    if any(part in (".ssh", ".azure", ".secrets") for part in parts[:-1]):
        return True
    if any(normalized == store or normalized.endswith("/" + store) for store in BLOCKED_STORES):
        return True
    return not safe_example(name) and any(fnmatch.fnmatchcase(name, pattern) for pattern in BLOCKED_NAMES)

def content_findings(content):
    # Scan bytes, including binary blobs: no decode failure can bypass these patterns.
    return [label for label, pattern in PATTERNS if pattern.search(content)]

def git(*args):
    return subprocess.check_output([os.environ.get("GIT", "git")] + list(args))

def check(staged=False):
    paths = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z") if staged else git("ls-files", "-z")
    count = 0
    findings = []
    for raw in paths.split(b"\0"):
        if not raw:
            continue
        path = os.fsdecode(raw)
        count += 1
        if forbidden_path(path):
            findings.append((path, "credential-file"))
        content = git("show", ":" + path)
        findings.extend((path, label) for label in content_findings(content))
    for path, label in findings:
        # Never print matched text or source lines. repr escapes malicious file names.
        print("Blocked {} in {}".format(label, repr(path)), file=sys.stderr)
    print("Secret guard: {} indexed files checked; {} findings.".format(count, len(findings)))
    return 1 if findings else 0

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staged", action="store_true", help="Check only staged added/changed files")
    args = parser.parse_args()
    try:
        return check(args.staged)
    except (OSError, subprocess.CalledProcessError):
        print("Secret guard could not read the Git index; check failed.", file=sys.stderr)
        return 2

if __name__ == "__main__":
    sys.exit(main())
