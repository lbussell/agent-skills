# agent-skills

A collection of my personal skills for AI coding agents.

## Skills

| Skill | Description |
|-------|-------------|
| **azure-pipelines-tasks** | Navigate Azure Pipelines task source code |
| **create-skill** | Guide for authoring agent skills |
| **dotnet-file-based-apps** | Create .NET apps from single C# files |
| **ghostty-config** | Configure Ghostty terminal |
| **github-actions-composite** | Create GitHub Actions composite actions |
| **prompt-engineering** | Techniques for effective LLM prompts |

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
