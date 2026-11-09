# Migrate Callers Then Delete Legacy APIs

When you replace an internal API, migrate every caller to the new interface and delete the legacy API in the same change.

Complete the migration before finishing the task:

- Search the repository for all callers of the legacy function, type, or configuration key and update them to use the new API.
- Remove the legacy implementation, wrapper functions, compatibility aliases, and unused types once callers are migrated.
- Update tests to assert the new contract and delete tests that check removed implementation details, following [Test Behavior, Not Implementation](./principle-test-behavior-not-implementation.md).

Apply this rule when all three conditions hold:

- Every caller lives in the repository or within the coordinated change scope.
- No external consumers depend on backward compatibility for the changed interface.
- The change simplifies or refactors an internal contract.
