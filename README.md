# GitHub Viral Marketer (Agent Skill)

This is a God Mode Agent Skill (compatible with Claude Code and Google Antigravity) that completely automates your GitHub growth, star velocity, and marketing distribution.

## Features

1. **Conversion Optimization Audit:** Ensures your README has high-contrast hooks and visual demos.
2. **Awesome-List Automation:** Automatically forks, edits, and submits PRs to Awesome lists (`awesome-pr.mjs`).
3. **Show HN & Reddit Writers:** Drafts targeted, technical narratives for developers.
4. **Outbound PR Engine:** An automated script (`outbound-pr-engine.mjs`) that searches for target repositories missing standard metadata, fixes them, and submits a PR linking back to your project to drive high-reputation stars.

## Installation for Agents

To install this skill, simply clone it into your agent's skills directory:

```bash
# For Antigravity
ln -sf $(pwd) ~/.gemini/config/skills/github-viral-marketer

# For Claude Code
ln -sf $(pwd) ~/.claude/skills/github-viral-marketer
```

## Running the PR Engine Manually
```bash
node scripts/outbound-pr-engine.mjs "topic:mcp-server" "https://github.com/YourName/YourRepo" "YourRepoName"
```
