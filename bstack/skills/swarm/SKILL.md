---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

## Start

Use `sql` with `todos` and `todo_deps` to open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Pick the worker model from the `swarm workers` line in `~/.copilot/instructions/bstack-models.instructions.md`, passing `<model> <effort>` as `model: "<model>"` and `reasoning_effort: "<effort>"`. If the file or role line is missing, use the skill default `grok-4.7-xhigh-fast` by passing the matching `model` value from the `task` schema and `reasoning_effort: "xhigh"`. For `auto` or `inherit-parent`, omit `model` and `reasoning_effort` so the workers run on the parent model. If the `task` tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid `model` of the same family from the `task` schema. For a model race, name each arm's model up front. Pick each subagent's `reasoning_effort` and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill.
4. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers in one message using `task` with `agent_type: "general-purpose"`, `mode: "background"`, and the step 3 `model` and `reasoning_effort`, left unset for `auto` or `inherit-parent`. Drop `environment: "cloud"`, `environment: "local"`, and `cloud_base_branch`; `task` inherits the current session and its checkout.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with a result table, issue one-liners, gaps or dropouts, and the race rule when used.
