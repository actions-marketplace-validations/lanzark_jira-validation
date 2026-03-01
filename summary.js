/**
 * Builds the GitHub Actions Job Summary markdown for JIRA validation results.
 *
 * @param {object} opts
 * @param {boolean}  opts.failed       - Whether any check failed
 * @param {boolean}  opts.skipCommit   - Whether commit checks were skipped
 * @param {string}   opts.exampleKey   - First JIRA project key (used in examples)
 * @param {RegExp}   opts.pattern      - The compiled JIRA regex
 * @param {object}   opts.results      - { branch, prTitle, commits[] }
 * @param {object[]} opts.badCommits   - Commits that failed validation
 * @returns {string} Markdown string
 */
function buildSummary({ failed, skipCommit, exampleKey, pattern, results, badCommits }) {
  const icon = (status) => {
    if (status === 'pass') return '\u2705';
    if (status === 'fail') return '\u274C';
    return '\u23ED\uFE0F';
  };

  let md = '';

  // --- Header ---
  md += failed
    ? `## \u274C JIRA Validation Failed\n\n`
    : `## \u2705 JIRA Validation Passed\n\n`;

  md += `**Pattern:** \`${pattern}\`\n\n`;

  // --- Overview table ---
  md += `### Overview\n\n`;
  md += `| Check | Value | Result |\n`;
  md += `|-------|-------|--------|\n`;

  if (results.branch) {
    md += `| Branch Name | \`${results.branch.value}\` | ${icon(results.branch.status)} ${results.branch.status.toUpperCase()} |\n`;
  }
  if (results.prTitle) {
    md += `| PR Title | \`${results.prTitle.value}\` | ${icon(results.prTitle.status)} ${results.prTitle.status.toUpperCase()} |\n`;
  }

  const commitStatus = skipCommit
    ? 'skipped'
    : (badCommits.length === 0 ? 'pass' : 'fail');
  md += `| Commit Messages | ${results.commits.length} commit(s) | ${icon(commitStatus)} ${commitStatus.toUpperCase()} |\n`;

  // --- Commit details table ---
  if (!skipCommit && results.commits.length > 0) {
    md += `\n### Commit Messages\n\n`;
    md += `| Status | SHA | Message |\n`;
    md += `|--------|-----|---------|\n`;

    for (const c of results.commits) {
      const escapedMsg = c.message.replace(/\|/g, '\\|');
      md += `| ${icon(c.status)} | \`${c.sha}\` | ${escapedMsg} |\n`;
    }
  }

  // --- Remediation: failed commits ---
  if (badCommits.length > 0) {
    md += `\n---\n`;
    md += `\n### \u{1F6E0}\uFE0F How to Fix Failed Commits\n\n`;
    md += `The following commit(s) are missing a JIRA ticket reference (e.g. \`${exampleKey}-123\`):\n\n`;

    for (const bc of badCommits) {
      md += `- \`${bc.sha}\` \u2014 ${bc.message}\n`;
    }

    md += `\n#### Option 1: Amend the most recent commit\n\n`;
    md += `If only your **last commit** needs fixing, amend it directly:\n\n`;
    md += `\`\`\`bash\n`;
    md += `git commit --amend -m "${exampleKey}-XXX your commit message"\n`;
    md += `git push --force-with-lease\n`;
    md += `\`\`\`\n\n`;

    md += `#### Option 2: Interactive rebase for older commits\n\n`;
    md += `If one or more **older commits** need fixing, use an interactive rebase.\n`;
    md += `Replace \`N\` with the number of commits you want to edit:\n\n`;
    md += `\`\`\`bash\n`;
    md += `git rebase -i HEAD~N\n`;
    md += `\`\`\`\n\n`;
    md += `In the editor that opens, change \`pick\` to \`reword\` for each commit you want to fix:\n\n`;
    md += `\`\`\`\n`;
    md += `reword a1b2c3d fix typo\n`;
    md += `pick   e4f5g6h ${exampleKey}-456 add feature\n`;
    md += `\`\`\`\n\n`;
    md += `Git will open an editor for each \`reword\` commit \u2014 add the JIRA ticket reference to the message.\n`;
    md += `Then force-push the updated history:\n\n`;
    md += `\`\`\`bash\n`;
    md += `git push --force-with-lease\n`;
    md += `\`\`\`\n\n`;

    md += `#### Option 3: Squash all commits into one\n\n`;
    md += `If you prefer to collapse everything into a single well-formatted commit:\n\n`;
    md += `\`\`\`bash\n`;
    md += `git reset --soft HEAD~N\n`;
    md += `git commit -m "${exampleKey}-XXX description of all changes"\n`;
    md += `git push --force-with-lease\n`;
    md += `\`\`\`\n\n`;

    md += `> **Note:** Always use \`--force-with-lease\` instead of \`--force\` \u2014 it\u2019s a safer option that\n`;
    md += `> prevents overwriting changes someone else may have pushed to the branch.\n`;
  }

  // --- Remediation: branch name ---
  if (results.branch && results.branch.status === 'fail') {
    md += `\n---\n`;
    md += `\n### \u{1F6E0}\uFE0F How to Fix the Branch Name\n\n`;
    md += `Your branch \`${results.branch.value}\` does not contain a JIRA reference.\n`;
    md += `Rename it locally and push the updated branch:\n\n`;
    md += `\`\`\`bash\n`;
    md += `git branch -m "${results.branch.value}" "${exampleKey}-XXX/${results.branch.value}"\n`;
    md += `git push origin -u "${exampleKey}-XXX/${results.branch.value}"\n`;
    md += `git push origin --delete "${results.branch.value}"\n`;
    md += `\`\`\`\n\n`;
    md += `> After renaming, you\u2019ll need to open a **new Pull Request** from the renamed branch.\n`;
  }

  // --- Remediation: PR title ---
  if (results.prTitle && results.prTitle.status === 'fail') {
    md += `\n---\n`;
    md += `\n### \u{1F6E0}\uFE0F How to Fix the PR Title\n\n`;
    md += `Update the PR title to include a JIRA ticket reference. For example:\n\n`;
    md += `\`\`\`\n`;
    md += `${exampleKey}-XXX: ${results.prTitle.value}\n`;
    md += `\`\`\`\n\n`;
    md += `You can edit the PR title directly at the top of this Pull Request page.\n`;
  }

  return md;
}

module.exports = { buildSummary };
