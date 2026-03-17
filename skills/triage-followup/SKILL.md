---
name: triage-followup
description: >-
  Produce a follow-up document from a .NET containers triage meeting. Takes a VTT transcript and
  correlates it with the user's recent GitHub activity to produce a markdown document with concrete
  to-dos and links. Use after a triage meeting when the user has a .vtt transcript file.
user-invocable: true
disable-model-invocation: true
---

## Workflow

### Step 1: Gather inputs in parallel

1. **Read the VTT transcript** — the user will provide the path.
2. **Fetch GitHub activity for the last hour** — use the GitHub events API:
   ```shell
   gh api "users/lbussell/events?per_page=100" --jq '[.[] | select(.created_at > "<since>")]'
   ```
   Group by repo, extract issue numbers, actions (labeled, assigned, commented, opened, closed), and comment bodies.

### Step 2: Convert VTT to clean markdown

Use a sub-agent to transform the raw VTT into readable markdown:
- Remove all VTT formatting (timestamps, cue IDs, `<v>` tags)
- Merge consecutive lines from the same speaker into coherent paragraphs
- Remove filler words (um, uh, OK, yeah, let me) and incomplete/non-substantive sentences
- Group by topic/issue discussed
- Fix common transcription errors (see table below)

Save to `triage-transcript.md` in the same directory as the VTT.

#### Common transcription errors

| Transcribed As | Actual Meaning |
|---|---|
| Cousteau | "close to" |
| Coppola / Coppola | Copilot |
| teasy data | tzdata |
| Bill Varg | build arg |
| Donna Docker | dotnet-docker |
| Servicore | Server Core |
| violent issue | file an issue |

### Step 3: Get full details for each issue touched

For every issue that appears in the GitHub events, fetch:
- Title, state, labels, assignees, URL (`gh issue view`)
- The user's triage comments from the last hour (`gh api` on issue comments)

### Step 4: Correlate and produce follow-up document

Create `triage-followups.md` with one section per issue/topic. Each section should include:
- **Issue link** with title
- **Local repo path** (see repo map below)
- **Status** — state, labels, assignees
- **Triage comment** — what the user wrote on GitHub
- **Discussion** — what was said in the meeting (from the transcript)
- **Decision** — what was decided
- **To-Do** — concrete action items as checkboxes

### Step 5: Categorize each follow-up

Label each item with one of:

| Category | Emoji | When to use |
|---|---|---|
| Ready for Work | 🟢 | Root cause is known, fix is clear, can start and finish now |
| In Progress | 🔵 | Already being actively worked on |
| Needs Investigation | 🟡 | Root cause unknown, feasibility unclear, or requires repro/research first |
| Blocked | ⏳ | Waiting on someone else or an external dependency |

Apply the label in each section heading, e.g. `## 3. Fix foobar — 🟢 Ready for Work`.

**Heuristics:**
- If the triage comment already identifies the root cause and the fix is a straightforward code change → **Ready for Work**
- If the triage comment says "I'll investigate" or "I'll look at this" → **Needs Investigation**
- If the meeting discussion mentions active development ("I have it working", "mostly done") → **In Progress**
- If it depends on someone else finishing something first → **Blocked**
- Filing a new issue to capture a known problem is **Ready for Work** (it's just writing)
- Doc updates where the correct content is already known are **Ready for Work**

### Step 6: Annotate with local repo paths

Map GitHub repos to local clones using the table below. Do not point to `dotnet-docker-internal` for code changes — it contains no source code (see note below).

## Repo Map

| GitHub Repo | Local Path | Notes |
|---|---|---|
| `dotnet/docker-tools` | `~/src/docker-tools` | ImageBuilder, pipeline infrastructure, publish pipeline code |
| `dotnet/dotnet-docker` | `~/src/dotnet-docker` | .NET Docker images (Dockerfiles, docs, tests) |
| `dotnet/dotnet-docker-internal` | `~/src/dotnet-docker-internal` | **No source code.** Only publish result issues and image-info files. See below. |
| `microsoft/dotnet-framework-docker` | `~/src/dotnet-framework-docker` | .NET Framework Docker images |

### dotnet-docker-internal has no source code

Issues filed in `dotnet/dotnet-docker-internal` are almost always auto-generated "Publish Result" issues created by the pipeline infrastructure in `dotnet/docker-tools`. When triaging these issues:

- The **code to fix** is in `~/src/docker-tools` (ImageBuilder / pipeline templates)
- The **pipeline YAML** may live in `~/src/dotnet-docker` or `~/src/dotnet-docker-internal`
- Always attribute the local repo as `~/src/docker-tools` for these items, with a note that the issue is filed in dotnet-docker-internal

## Tips

- The user's GitHub username is `lbussell`.
- Triage comments typically start with `[Triage]`.
- The meeting is usually between Logan Bussell and Matt Thalman.
- The `gh api "users/lbussell/events"` endpoint is the fastest way to get all activity — it covers issue comments, label changes, assignments, and issue creation in one call.
- Launch the VTT conversion as a background sub-agent while fetching GitHub data in parallel to save time.
