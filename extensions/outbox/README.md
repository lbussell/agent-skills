# Outbox

Outbox is a Copilot canvas extension (`outbox`) and tool (`outbox_submit_proposal`) for reviewing proposed text and yes-or-no decisions.
Users can edit proposed values inline, then approve or decline the proposal without back-and-forth turns in chat.

## Setup

Run `.\install.ps1` from the repository root to link `extensions\outbox` into `~/.copilot/extensions/outbox`.

## Usage

Call `outbox_submit_proposal` to add a proposal to the queue and open the Outbox panel:

```json
{
  "id": "create-pr",
  "title": "Create pull request",
  "decisions": [
    { "name": "Title", "type": "text", "value": "Update Outbox canvas extension" },
    { "name": "Body", "type": "text", "value": "Summary of changes..." },
    { "name": "Submit as draft", "type": "yes_no", "value": false }
  ]
}
```

Proposal fields follow these rules:

- `id` is required, must not match a pending proposal, and accepts 1-100 characters (`A-Z`, `a-z`, `0-9`, and `. _ : / # -`, starting with a letter or digit).
- `title` and `description` are optional strings displayed on the proposal card.
- `decisions` is an optional array of items with unique `name` strings, a `type` (`"text"` or `"yes_no"`), and optional `description` and `value` fields.
- `"text"` decisions render an auto-sizing textarea initialized to `value` (defaults to `""`).
- `"yes_no"` decisions render `Yes`, `No`, and `No answer` options initialized to `value` (`true`, `false`, or omitted for `No answer`).

When the user approves or declines a proposal, Outbox removes it from the queue and sends a `[outbox]` reply to the session.

## Canvas actions

The `outbox` canvas also exposes two actions:

- `submit_proposal` adds a proposal using the same input schema as `outbox_submit_proposal`.
- `list_pending` returns the pending proposals (`id`, `title`, `decisions`, and `createdAt`).
