# Outbox

Canvas extension (`outbox`) for reviewing, editing, and approving or declining batches of proposed inputs before submission (such as pull request or issue titles, bodies, and flags).

## Input format

Open the canvas with `open_canvas` (`canvasId: "outbox"`, `instanceId: "outbox"`) or invoke the `propose` action with a unique `name` and one or more `inputs`:

```json
{
  "name": "Create PR",
  "inputs": [
    { "id": "title", "label": "Title", "type": "text", "value": "Add Outbox canvas extension" },
    { "id": "body", "label": "Body", "type": "text", "value": "Description..." },
    { "id": "draft", "label": "Submit as draft", "type": "checkbox" }
  ]
}
```

- `name` is required and must not collide with any currently pending proposal.
- `text` inputs render an auto-sizing text block initialized to `value`.
- `checkbox` inputs render a `[ Yes | Decline | No ]` button group initialized to `Decline`.
- Approving or declining a proposal sends the result back to the session and removes the proposal card from Outbox.
