---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript using `session_store_sql`, scoped to this repository or working directory. Do not query across other repositories or working directories. That crosses workspace boundaries and reads private chats from unrelated projects.

Query `sessions` and `turns` in `session_store_sql` scoped to this repository or `cwd`, and take the session whose opening `user_message` contains the conversation's opening user prompt. If none matches, pass a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three `task` calls, `agent_type: "general-purpose"`. Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references, and `agent_type: "explore"` strips MCPs.

Each reviewer and the synthesizer name a role line in `~/.copilot/instructions/pstack-models.instructions.md` and a default. For a `<model> <effort>` role value, set `model: "<model>"` and `reasoning_effort: "<effort>"`; if the file or the line is missing, map the default slug to the matching `model` value from the `task` schema and pass the effort as `reasoning_effort`. Omit `model` and `reasoning_effort` when the value is `auto` or `inherit-parent`. If the `task` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message. Pick each subagent's `reasoning_effort` and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `grok-4.7-xhigh-fast` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript session ID or digest where marked. Reviewers return findings in the `task` response body.

## 3. Synthesize

One `task` call, `agent_type: "general-purpose"`, with `model` and `reasoning_effort` from the `reflect judgment, divergent, synthesizer` line in `~/.copilot/instructions/pstack-models.instructions.md` (default `claude-opus-5-5-xhigh`, mapped to the matching `model` in the `task` schema with `reasoning_effort: "xhigh"`). It spot-verifies citations through MCP, and `agent_type: "explore"` strips MCPs. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Never edit a skill under `plugins/cache/`. Before approval, show its destination: an existing compatible skill directory in the repo (`.agents/skills/`, `.github/skills/`, `.claude/skills/`, or `.copilot/skills/`) or user home (`~/.agents/skills/` or `~/.copilot/skills/`), defaulting to `.agents/skills/<skill>/` or `~/.agents/skills/<skill>/` when none exists. After approval, copy the skill folder there and edit the copy. Never open a PR or push.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to Cursor's built-in `create-skill` skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `create-skill` and run its description-optimization loop.
- `new skill via create-skill: <kebab-name>`: hand creation to `create-skill`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
