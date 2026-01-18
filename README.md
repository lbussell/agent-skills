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

## License

MIT
