#!/usr/bin/env python3
"""Run the pinned CI scanner against generated synthetic input, without logging it."""
from pathlib import Path
import os
import subprocess
import sys
import tempfile

IMAGE = "ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f"
CONFIG = Path(__file__).resolve().parents[2] / ".github/security/gitleaks.toml"

def run_case(command, content, expected, label):
    try:
        result = subprocess.run(command, input=content, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError:
        print("Scanner infrastructure failed for " + label, file=sys.stderr)
        return False
    if result.returncode != expected:
        print("Scanner contract failed for {} (exit {}, expected {}).".format(
            label, result.returncode, expected), file=sys.stderr)
        return False
    print("Scanner contract passed: " + label)
    return True

def history_controls():
    with tempfile.TemporaryDirectory() as temp:
        git = os.environ.get("GIT", "git")
        command = [git, "-C", temp]
        def execute(*args):
            subprocess.run(command + list(args), check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        execute("init", "-q")
        path = Path(temp) / "fixture.txt"
        path.write_bytes(b"Safe synthetic fixture\n")
        execute("add", "fixture.txt")
        execute("-c", "user.name=Synthetic test", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "safe synthetic fixture")
        scanner = ["docker", "run", "--rm", "--network=none", "--read-only",
                   "--cap-drop=ALL", "--security-opt=no-new-privileges",
                   "-v", str(CONFIG) + ":/config/gitleaks.toml:ro",
                   "-v", temp + ":/fixture:ro", IMAGE, "git", "/fixture",
                   "--config=/config/gitleaks.toml", "--log-opts=--all",
                   "--redact=100", "--no-banner", "--log-level=error", "--ignore-gitleaks-allow"]
        if not run_case(scanner, None, 0, "safe synthetic Git history"):
            return False
        path.write_bytes(b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0") + b"\n")
        execute("add", "fixture.txt")
        execute("-c", "user.name=Synthetic test", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "nonfunctional synthetic sentinel")
        path.write_bytes(b"Safe current tree\n")
        execute("add", "fixture.txt")
        execute("-c", "user.name=Synthetic test", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "remove synthetic sentinel from current tree")
        return run_case(scanner, None, 1, "removed synthetic sentinel in Git history")

def main():
    tests = (
        ("synthetic GitHub PAT", b"token = ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0") + b"\n", 1),
        ("synthetic private key", b"-----BEGIN " + b"RSA PRIVATE KEY-----\n"
         + b"NONFUNCTIONAL_SYNTHETIC_TEST_DATA\n" * 3
         + b"-----END " + b"RSA PRIVATE KEY-----\n", 1),
        ("safe template", b"API_KEY=replace-me\nTOKEN=example\nPASSWORD=<your-password>\n", 0),
        ("public certificate", b"-----BEGIN CERTIFICATE-----\nSYNTHETIC PUBLIC CERTIFICATE\n", 0),
    )
    for label, content, expected in tests:
        if not run_case([
            "docker", "run", "--rm", "-i", "--network=none", "--read-only",
            "--cap-drop=ALL", "--security-opt=no-new-privileges",
            "-v", str(CONFIG) + ":/config/gitleaks.toml:ro",
            IMAGE, "stdin", "--config=/config/gitleaks.toml",
            "--redact=100", "--no-banner", "--log-level=error", "--ignore-gitleaks-allow",
        ], content, expected, label):
            return 1
    try:
        return 0 if history_controls() else 1
    except (OSError, subprocess.CalledProcessError):
        print("Synthetic Git-history setup failed; scanner contract failed.", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
