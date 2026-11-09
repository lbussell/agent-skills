# Test Behavior, Not Implementation

Write tests that invoke the public interface with concrete inputs and assert the outputs, state changes, and external effects that callers or users observe.

Evaluate every test against two checks and rewrite or delete any test that fails either check:

- If you break the observable behavior (return a wrong value, skip a side effect, or duplicate a side effect), the test fails.
- If you refactor internal helpers, private state, or call order while preserving observable outputs, the test continues to pass.

Follow these rules when writing assertions:

- Drive the code through the same interface that callers, users, or external services use.
- Write expected values as concrete literals derived from the requirement so the test never calls the code under test to compute its own expected output.
- Match each assertion to the observable contract for that scenario:

| Scenario | Observable contract to assert | Brittle check to avoid |
| --- | --- | --- |
| Function return or query result | Exact return value or state read back through the public interface | Private helper calls or intermediate local state |
| External side effect (HTTP request, database write, emitted message) | Payload sent to the external boundary or persisted record | Call order or argument shapes of internal collaborators |
| Guarded side effect (such as "an empty cart never charges") | Zero calls to the external payment boundary on the empty case, paired with a positive test case that triggers a charge | Asserting only the negative case without proving the test can observe a call |
| Error handling | Error type, status code, or structured field that callers branch on | Exact wording of an internal error message |
| Structural rule across modules or schemas | Invariant check, such as matching keys across two tables or a compile-time type check | Restating a constant or prompt string without running the code that consumes it |
