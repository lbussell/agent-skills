# Rationale template

Replace the italic notes with actual content.

## Problem

*A couple sentences. What we're trying to do, and what about the existing system or constraints makes the shape non-obvious. If you were told constraints the design must honor (existing types to interop with, callers we can't break, invariants that crossed our boundary), list them here in bullet points so the reader sees the same constraints you saw.*

## Usage (caller's view)

*Show how this code is intended to be used. This must match up with the Shape section below.*

## Shape

*The recommended architecture. Data structures first; then how data flows through the signatures. State which invariants are encoded in types, where validation lives, and what the system deliberately does not do. Judge interface depth explicitly. State what complexity the public surface hides, what remains exposed to callers, and why the interface is no larger than needed. Cite the principle behind each decision (e.g., `per-boundary-discipline`); don't restate it.*
