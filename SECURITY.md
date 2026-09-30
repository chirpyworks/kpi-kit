# Security and data safety

KPI Kit is an alpha client-side source kit and has not undergone an independent security audit. It does not provide authentication or authorization.

Do not place credentials, private customer data, personal contact details, or database connection strings in `public/`, source files, screenshots, issues, or fixtures. Anything shipped in a static browser bundle can be inspected. Connect private datasets through your own authorized server. Hiding a component is not access control.

The example JSON importer validates a bounded local file and keeps it in browser memory. It does not upload or persist that file. CSV export neutralizes common spreadsheet formula prefixes in text cells, but downstream spreadsheet behavior can differ.

Use GitHub's private vulnerability reporting if it is enabled for this repository. Otherwise, do not publish exploitable details or secrets in a public issue; ask for a private contact route without including sensitive details.

The verification workflow runs on pull requests, pushes to `main`, and manual dispatch. It uses a GitHub-hosted runner with read-only repository permission, installs project/test dependencies, and executes repository code. Review workflow changes carefully. It does not deploy, publish npm packages, or receive publication secrets.
