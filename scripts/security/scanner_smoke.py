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
        # Only scalar scan summaries from the synthetic fixture may be shown.
        if "Git history" in label:
            for line in result.stderr.decode(errors="replace").splitlines():
                if any(summary in line for summary in ("commits scanned", "no leaks found", "leaks found")):
                    print("Synthetic fixture summary: " + line[:200], file=sys.stderr)
        return False
    print("Scanner contract passed: " + label)
    return True

def history_controls():
    # GitHub's shared runner temp is suitable for Docker bind mounts.
    with tempfile.TemporaryDirectory(dir=os.environ.get("RUNNER_TEMP")) as temp:
        # This directory contains only inert fixtures. With capabilities dropped,
        # container root cannot bypass the runner-owned mkdtemp default mode 0700.
        Path(temp).chmod(0o755)
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
                   "-e", "GIT_CONFIG_COUNT=1", "-e", "GIT_CONFIG_KEY_0=safe.directory",
                   "-e", "GIT_CONFIG_VALUE_0=/fixture",
                   "-v", str(CONFIG) + ":/config/gitleaks.toml:ro",
                   "-v", temp + ":/fixture:ro", IMAGE, "git", "/fixture",
                   "--config=/config/gitleaks.toml", "--log-opts=--all --format=medium",
                   "--redact=100", "--no-banner", "--log-level=info", "--ignore-gitleaks-allow"]
        if not run_case(scanner, None, 0, "safe synthetic Git history"):
            return False
        marker = b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0")
        path.write_bytes(b"token" + b" = " + marker + b"\n")
        execute("add", "fixture.txt")
        execute("-c", "user.name=Synthetic test", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "nonfunctional synthetic sentinel")
        path.write_bytes(b"Safe current tree\n")
        execute("add", "fixture.txt")
        execute("-c", "user.name=Synthetic test", "-c", "user.email=test@example.invalid",
                "commit", "-qm", "remove synthetic sentinel from current tree")
        history = subprocess.check_output(command + ["log", "--all", "-p"])
        if marker not in history or marker in path.read_bytes():
            print("Synthetic Git-history construction failed.", file=sys.stderr)
            return False
        container_log = subprocess.run([
            "docker", "run", "--rm", "--network=none", "--read-only",
            "--cap-drop=ALL", "--security-opt=no-new-privileges", "--entrypoint=git",
            "-v", temp + ":/fixture:ro", IMAGE, "-c", "safe.directory=/fixture",
            "-C", "/fixture", "log", "--all",
            "-p", "--format=medium",
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if container_log.returncode or marker not in container_log.stdout:
            print("Container could not read the synthetic Git history (exit {}, bytes {}).".format(
                container_log.returncode, len(container_log.stdout)), file=sys.stderr)
            error_text = container_log.stderr.decode(errors="replace").lower()
            for category in ("dubious ownership", "not a git repository", "permission denied",
                             "bad object", "unknown revision", "unable to read", "no such file"):
                if category in error_text:
                    print("Synthetic container Git error category: " + category, file=sys.stderr)
            return False
        print("Container synthetic Git history verified without printing its contents.")
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
