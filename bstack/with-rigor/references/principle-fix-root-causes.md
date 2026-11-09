# Fix Root Causes

Trace every defect from its visible symptom back to the first point where the system produced an invalid state or mishandled a valid state, and fix the fault at its origin.

Follow these steps when diagnosing and fixing a bug:

1. Reproduce the failure reliably before changing code.
2. Trace the data flow backward from the symptom until you find the first place where the code made a wrong decision.
3. Add temporary logging or instrumentation to inspect live errors and state whenever the execution path is unclear.
4. Determine whether the state that triggered the failure is valid in the domain:
   - If the state is valid, update the failing consumer to handle it.
   - If the state violates an invariant, find and fix the upstream producer that created it, and avoid masking the fault with nil guards, retries, clamped values, or swallowed errors.
5. When a failure occurs only after a restart, inspect persisted state first, including configuration files, caches, lockfiles, and serialized session data.
6. Search the codebase for other call sites with the same fault pattern and fix them in the same change.
7. When a fix seems to require a long comment to justify a workaround, redesign the fix so the code addresses the underlying cause directly.
8. When isolating the root cause required heavy instrumentation, add a lightweight error message, assertion, or metric that surfaces the failure immediately next time.
