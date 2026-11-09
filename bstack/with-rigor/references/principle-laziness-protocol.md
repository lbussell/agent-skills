# Laziness Protocol

Delete unnecessary code and make the smallest change that solves the problem.

Apply these rules when you size a change or refactor code:

- Put each decision in one source of truth and pass the result to callers as a plain value or flag.
- Delete unused branches, wrappers, and helper layers before adding new code.
- Write direct code that solves the current problem without speculative abstractions or boilerplate.
