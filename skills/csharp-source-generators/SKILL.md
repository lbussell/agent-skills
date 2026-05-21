---
name: csharp-source-generators
description: Guide for creating, reviewing, and debugging C# incremental source generators based on the official Roslyn cookbook. Use when working with C# source generators, including creating new generators from scratch, reviewing existing generator code for best practices and performance, debugging generator issues, implementing common patterns (ForAttributeWithMetadataName, augmenting user code, additional file transformation), or applying incrementality conventions to improve IDE performance.
---

# C# Incremental Source Generators

## Overview

This skill provides guidance for working with C# incremental source generators based on the official Roslyn incremental generators cookbook. Source generators are **additive only**—they produce C# source code to be added to compilations but cannot modify existing user code.

## Core Principles

**Additive Only**: Generators add new source code but cannot modify existing code.

**Unordered Execution**: Each generator sees the same input compilation without access to other generators' outputs.

**Incrementality**: Proper pipeline design with equatable states enables the compiler to cut off changes early and reuse cached outputs.

## Critical Conventions

### Pipeline Model Design

Models must be **value equatable** for incrementality. Follow these rules:

- Use `record` types instead of `class` types for automatic value equality
- **Never include symbols** (`ISymbol`) in models—they prevent equality and cause memory leaks
- Remove `SyntaxNode`s from models as early as possible (they're not equatable between runs)
- Remove `Location`s from models early (same reason as `SyntaxNode`s)
- Use wrapper types for collections to provide value-based equality (arrays, `ImmutableArray<T>`, `List<T>` use reference equality by default)
- Extract information from symbols into equatable representations like `string`s

### Use ForAttributeWithMetadataName

**Always prefer `SyntaxProvider.ForAttributeWithMetadataName`** over `CreateSyntaxProvider`. It is at least 99x more efficient.

Benefits:
- Dramatically improved performance in editors
- Clear user intent to use your generator
- Enables companion analyzers for better user experience

### Generate Text, Not SyntaxNodes

Use an indented text writer wrapping `StringBuilder` rather than building `SyntaxNode`s. Calling `NormalizeWhitespace()` is expensive and the API isn't designed for code generation.

### EmbeddedAttribute Pattern

Mark generated internal marker attributes with `Microsoft.CodeAnalysis.EmbeddedAttribute` to avoid duplicate-definition warnings when projects use `InternalsVisibleTo`. Call `AddEmbeddedAttributeDefinition()` in your `RegisterPostInitializationOutput` callback.

### Avoid Indirect Markers

**Do not** scan for types that:
- Indirectly implement interfaces
- Indirectly inherit from base types
- Are indirectly attributed from base types/interfaces

These patterns require expensive full-compilation scans that destroy IDE performance and cannot be done incrementally.

## Out of Scope

Source generators are **not** designed for:

- **Language features**: Don't implement language features as generators (creates incompatible C# dialects)
- **Code rewriting**: IL weaving, optimization, logging injection, call site rewriting (except experimental interceptors)

## Common Patterns

The cookbook in `references/cookbook.md` contains detailed implementations for:

1. **Generated classes** - Creating marker attributes or types users reference before generation
2. **Additional file transformation** - Converting XML/JSON/other formats to C# code
3. **Augment user code** - Generating partial implementations for user-marked partial classes
4. **Issue diagnostics** - Best practice: use separate analyzers, not generators
5. **INotifyPropertyChanged** - Property change notification pattern implementation
6. **NuGet packaging** - Proper analyzer directory structure for distribution
7. **Dependency management** - Consuming NuGet packages in generators
8. **Configuration access** - Reading analyzer configs and MSBuild properties
9. **Unit testing** - Using `Microsoft.CodeAnalysis.Testing` packages
10. **Auto interface implementation** - Generating interface implementations

## Workflow

### Creating a New Generator

1. Define the user-facing API (attributes, partial classes, etc.)
2. Design the pipeline with value-equatable models
3. Use `ForAttributeWithMetadataName` for attribute-based triggers
4. Extract symbol information to strings/primitives early
5. Generate code using indented text writers
6. Test with `Microsoft.CodeAnalysis.Testing`

### Reviewing Existing Generators

Check for these issues:
- Models contain `ISymbol`, `SyntaxNode`, or `Location` objects
- Using `CreateSyntaxProvider` instead of `ForAttributeWithMetadataName`
- Scanning for indirect inheritance/interface implementation
- Using `NormalizeWhitespace()` for code generation
- Missing `EmbeddedAttribute` on internal marker types
- Collections without value equality in models

### Debugging Performance Issues

Common causes:
- Models not properly equatable (pipeline can't short-circuit)
- Scanning entire compilation for indirect markers
- Not using `ForAttributeWithMetadataName`
- Rooting old compilations via symbols in models

## Reference

See `references/cookbook.md` for the complete Roslyn incremental generators cookbook with detailed code examples and implementations.
