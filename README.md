# agent-skills

A collection of my personal skills for AI coding agents.

## Skills

<!-- BEGIN GENERATED SKILLS TABLE -->
| Skill | Description | Tokens |
|-------|-------------|-------------|
| [**creating-issues**](./skills/creating-issues/SKILL.md) | Open an issue on GitHub. Use when the user asks to file/open/draft/create an issue. Useful for bug reports, pipeline failures, feature requests, etc. | 849 |
| [**creating-pull-requests**](./skills/creating-pull-requests/SKILL.md) | Open a pull request on GitHub. Use when the user asks to open or create a pull request on GitHub. | 841 |
| [**property-testing-cscheck**](./skills/property-testing-cscheck/SKILL.md) | Write property-based tests in C# using CsCheck. Covers generator composition, property selection (round-trip, invariant, model-based, metamorphic), parallel linearizability testing, performance comparison, classification, and configuration. Use when writing, reviewing, or improving property-based tests in a .NET project that uses CsCheck. | 1,678 |
| [**triaging-issues**](./skills/triaging-issues/SKILL.md) | Triage issues labeled 'untriaged' in a repository. Investigates each issue, correlates with recent activity, and categorizes into: customer issue, ready for work, needs investigation, or already addressed. Informational only — does not modify issues. | 556 |
<!-- END GENERATED SKILLS TABLE -->

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
