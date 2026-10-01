#!/usr/bin/env python3
"""Regression checks using generated, clearly nonfunctional sentinels."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock
from types import SimpleNamespace
import contextlib
import io
import check_secrets as guard
import scanner_smoke

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
GIT = os.environ.get("GIT", "git")

class SecretGuardTests(unittest.TestCase):
    def test_history_fixture_retains_removed_sentinel(self):
        seen = []
        def inspect_fixture(command, content, expected, label):
            # Inspect real Git fixture construction; do not run or emulate Gitleaks.
            mount = next(item for item in command if item.endswith(":/fixture:ro"))
            folder = mount[:-len(":/fixture:ro")]
            history = subprocess.check_output([GIT, "-C", folder, "log", "--all", "-p"])
            current = (Path(folder) / "fixture.txt").read_bytes()
            marker = b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0")
            self.assertIn("--log-opts=--all", command)
            self.assertFalse(marker in current, "Current fixture must remain safe")
            self.assertEqual(expected == 1, marker in history, "Historical fixture construction is incorrect")
            seen.append(expected)
            return True
        with mock.patch.object(scanner_smoke, "run_case", side_effect=inspect_fixture):
            self.assertTrue(scanner_smoke.history_controls())
        self.assertEqual([0, 1], seen)

    def test_git_failure_returns_two_without_payload(self):
        with tempfile.TemporaryDirectory() as temp:
            env = dict(os.environ, GIT=str(Path(temp) / "missing-git"))
            result = subprocess.run([os.sys.executable, "-B", str(HERE / "check_secrets.py")],
                                    cwd=temp, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertEqual(2, result.returncode)
            self.assertIn(b"check failed", result.stderr)

    def test_scanner_wrapper_fails_closed_and_suppresses_process_output(self):
        # Mocked infrastructure exits verify the wrapper, never real scanner detection.
        marker = b"NONFUNCTIONAL PRIVATE PROCESS OUTPUT"
        for expected, actual in ((1, 2), (0, 1), (1, 0)):
            result = SimpleNamespace(returncode=actual, stdout=marker, stderr=marker)
            output = io.StringIO()
            with mock.patch.object(scanner_smoke.subprocess, "run", return_value=result):
                with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                    self.assertFalse(scanner_smoke.run_case(["unused-scanner"], b"safe", expected, "synthetic failure"))
            self.assertFalse(marker.decode() in output.getvalue(), "Process output was exposed")
        with mock.patch.object(scanner_smoke.subprocess, "run", side_effect=OSError("private detail")):
            output = io.StringIO()
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                self.assertFalse(scanner_smoke.run_case(["unused-scanner"], b"safe", 0, "missing scanner"))
            self.assertFalse("private detail" in output.getvalue(), "Exception detail was exposed")

    def test_provider_and_private_key_patterns(self):
        samples = [
            ("github-token", b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0")),
            ("github-token", b"github_" + b"pat_" + b"SYNTHETICNONFUNCTIONAL".ljust(40, b"0")),
            ("openai-token", b"sk-" + b"proj-" + b"SYNTHETICNONFUNCTIONAL".ljust(50, b"0")),
            ("aws-access-id", b"AKIA" + b"SYNTHETIC".ljust(16, b"0")),
            ("slack-token", b"xoxb-" + b"SYNTHETICNONFUNCTIONAL000000"),
            ("private-key", b"-----BEGIN " + b"OPENSSH PRIVATE KEY-----\nNONFUNCTIONAL TEST DATA"),
        ]
        for label, content in samples:
            with self.subTest(label=label):
                self.assertIn(label, guard.content_findings(content))

    def test_safe_examples_and_public_certificates(self):
        self.assertEqual([], guard.content_findings(
            b"API_KEY=replace-me\nPASSWORD=<your-password>\nTOKEN=example\n"
            b"-----BEGIN CERTIFICATE-----\nSYNTHETIC PUBLIC CERTIFICATE\n"
        ))
        for path in (".env.example", ".env.template", ".env.sample", "app/.env.production.example",
                     "app/.env.test.template", "certs/ca.pem", "id_ed25519.pub",
                     "credentials.example.json", "service-account.dev.template.json",
                     "dev_credentials.example.json", ".npmrc", "settings.json"):
            with self.subTest(path=path):
                self.assertFalse(guard.forbidden_path(path))

    def test_safe_name_does_not_allow_token_content(self):
        self.assertFalse(guard.forbidden_path(".env.example"))
        self.assertIn("github-token", guard.content_findings(
            b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0")))

    def test_ignore_rules_match_secret_file_policy(self):
        blocked = (".env", "app/.env.local", ".env.production", ".env.production.local",
                   ".envrc", "dev/secrets.local.json", "certs/server.key", "bundle.p12",
                   "bundle.pfx", "vault.jks", "vault.keystore", "certs/server.private.pem",
                   "certs/server-private.pem", "certs/private-key.pem", "certs/privkey.pem",
                   "certs/server-key.pem", "certs/server_key.pem", "key.pem", "private.pem", "keys/id_ed25519",
                   ".aws/credentials", "app/.aws/config", ".ssh/key", ".azure/msal_token_cache.json",
                   ".secrets/anything", ".docker/config.json", ".config/gh/hosts.yml",
                   ".config/gcloud/application_default_credentials.json", ".netrc", "_netrc",
                   ".git-credentials", ".npmrc.local", ".pypirc", "credentials.json",
                   "service-account-prod.json", "prod_credentials.json")
        allowed = (".env.example", "app/.env.template", "app/.env.production.example",
                   ".env.sample", ".env.test.template", "certs/public.pem",
                   "credentials.example.json", "service-account.example.json",
                   "prod_credentials.template.json", "keys/id_ed25519.pub", ".npmrc")
        with tempfile.TemporaryDirectory() as temp:
            subprocess.check_call([GIT, "init", "-q", temp])
            root = Path(temp)
            (root / ".gitignore").write_text((REPO / ".gitignore").read_text())
            for path in blocked + allowed:
                target = root / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("NONFUNCTIONAL TEST DATA")
                ignored = subprocess.run([GIT, "-C", temp, "check-ignore", "--no-index", "-q", path]).returncode
                self.assertIn(ignored, (0, 1))
                self.assertEqual(path in blocked, ignored == 0, path)
                self.assertEqual(path in blocked, guard.forbidden_path(path), path)

    def test_index_scan_detects_tracked_ignored_files_and_redacts_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            subprocess.check_call([GIT, "init", "-q", temp])
            (root / ".gitignore").write_text(".env\n")
            sentinel = b"ghp_" + b"SYNTHETICNONFUNCTIONAL".ljust(36, b"0")
            (root / ".env").write_bytes(b"TOKEN" + b"=" + sentinel)
            (root / "notes.md").write_bytes(sentinel)
            (root / "binary.bin").write_bytes(b"\0" + sentinel)
            subprocess.check_call([GIT, "-C", temp, "add", "-f", ".env", "notes.md", "binary.bin"])
            # Working-tree edits cannot hide a secret still present in the staged index.
            (root / "notes.md").write_text("safe working tree")
            result = subprocess.run([os.sys.executable, str(HERE / "check_secrets.py")],
                                    cwd=temp, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertEqual(1, result.returncode)
            self.assertFalse(sentinel in result.stdout + result.stderr, "Guard leaked synthetic match text")
            self.assertIn(b"credential-file", result.stderr)
            self.assertIn(b"notes.md", result.stderr)
            self.assertIn(b"binary.bin", result.stderr)

    def test_staged_deletion_and_clean_safe_example(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            subprocess.check_call([GIT, "init", "-q", temp])
            (root / ".env.example").write_text("API_KEY=replace-me\n")
            subprocess.check_call([GIT, "-C", temp, "add", ".env.example"])
            subprocess.check_call([GIT, "-C", temp, "-c", "user.name=Synthetic test",
                                   "-c", "user.email=test@example.invalid", "commit", "-qm", "safe fixture"])
            subprocess.check_call([GIT, "-C", temp, "rm", "-q", ".env.example"])
            result = subprocess.run([os.sys.executable, str(HERE / "check_secrets.py"), "--staged"],
                                    cwd=temp, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertEqual(0, result.returncode)

if __name__ == "__main__":
    unittest.main()
