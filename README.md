# agent-skills

A collection of my personal skills for AI coding agents.

## Skills

| Skill | Description |
|-------|-------------|
| **create-sub-agent-worktree** | Spawn a Copilot CLI agent in its own git worktree and tmux window |
| **investigating-pipeline** | Diagnose a single Azure Pipelines build — timeline tree and task logs |
| **investigating-pull-request** | Show CI status for a GitHub PR with Azure Pipelines build timelines |
| **triage-followup** | Produce a follow-up document from a .NET containers triage meeting transcript |
| **triage-pipelines** | List all failing and warning Azure Pipelines for daily triage |
| **triage-pull-requests** | Review CI status of all open PRs in a repository |

The investigating and triage skills auto-detect the current repository:
- **GitHub repo** — via `gh repo set-default --view`
- **Azure DevOps org/project** — parsed from an Azure DevOps git remote

## Installation

### Claude Code

```bash
# From a local clone
claude --plugin-dir /path/to/agent-skills

# Or add the marketplace and install
/plugin marketplace add lbussell/agent-skills
/plugin install agent-skills@lbussell/agent-skills
```

### Copilot CLI

1. Clone this repo
2. Run `/skills add ./skills` from the Copilot CLI

To update skills:

1. Pull the latest changes from this git repo
2. Run `/skills reload` from the Copilot CLI

## Attribution

- [commit](./skills/commit/SKILL.md) is largely based on the excellent article [*How to Write a Git Commit Message*](https://chris.beams.io/posts/git-commit/) ([archived version](https://web.archive.org/web/20251224201710/https://chris.beams.io/git-commit)) by Chris Beams.
- [create-skill](./skills/create-skill/SKILL.md) is based on [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) ([archived version](https://web.archive.org/web/20260117072412/https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)) from the Claude documentation.
- [open-pull-request](./skills/open-pull-request/SKILL.md) is based on [Writing good CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html) by Google ([archived version](https://github.com/lbussell/google-eng-practices/blob/master/review/developer/cl-descriptions.md)).

## License

MIT
