# JIRA Validation Action

A reusable GitHub Action that validates PR titles, branch names, and commit messages contain a JIRA ticket reference (e.g. `DOKTUZ-123`).

## Usage

Add to `.github/workflows/jira-check.yml` in any repo:

```yaml
name: JIRA Validation
on:
  pull_request:
    types: [opened, synchronize, reopened, edited]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: lanzark/jira-validation@v1
        with:
          jira-keys: 'DOKTUZ'
```

Multiple keys:

```yaml
      - uses: lanzark/jira-validation@v1
        with:
          jira-keys: 'DOKTUZ,PROJ,TEAM'
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `jira-keys` | Yes | | Comma-separated JIRA project keys |
| `skip-branch-check` | No | `false` | Skip branch name validation |
| `skip-commit-check` | No | `false` | Skip commit message validation |
| `skip-pr-title-check` | No | `false` | Skip PR title validation |

## Behavior

- Matching is **case-insensitive** (`doktuz-123`, `DOKTUZ-123`, `Doktuz-123` all match)
- **Merge commits** are automatically skipped
- Only the **first line** of each commit message is checked
- On failure, a **Markdown job summary** is posted with a remediation guide (amend, rebase, or squash instructions)
- The GitHub API returns a maximum of 250 commits per PR

## Development

```bash
npm install
npm test
```

## License

MIT
