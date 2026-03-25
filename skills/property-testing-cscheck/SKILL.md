---
name: property-testing-cscheck
description: >-
  Write property-based tests in C# using CsCheck. Covers generator composition, property selection
  (round-trip, invariant, model-based, metamorphic), parallel linearizability testing, performance
  comparison, classification, and configuration. Use when writing, reviewing, or improving
  property-based tests in a .NET project that uses CsCheck.
---

## Quick reference

CsCheck is a C# random testing library. Shrinking is automatic via PCG — never write shrink logic.

**NuGet:** `CsCheck`

### Generator composition

Build generators with `Gen` primitives and LINQ:

```csharp
// Primitives: Gen.Int, Gen.Long, Gen.Double, Gen.Float, Gen.Bool, Gen.Byte,
//   Gen.Char.AlphaNumeric, Gen.String, Gen.Guid, Gen.DateTime, Gen.DateTimeOffset
// Ranges: Gen.Int[0, 100], Gen.Double[0.0, 1.0]
// Collections: gen.Array, gen.Array[minLen, maxLen], gen.List[minLen, maxLen]
// Nullables: gen.Null() (wraps Gen<T> → Gen<T?>)
// Dictionaries: Gen.Dictionary(genKey, genValue)[minCount, maxCount]
// Filtering: gen.Where(predicate) — use sparingly, prefer constructive generation
// Mapping: gen.Select(transform)
// FlatMap: gen.SelectMany(gen2, combine) or LINQ query syntax
// Constant: Gen.Const(value)
// Choice: Gen.OneOf(gen1, gen2, gen3)
// Tuples: Gen.Select(genA, genB), Gen.Select(genA, genB, genC)
// Recursive: Gen.Recursive<T>((depth, self) => ...)
```

Compose domain objects with `Select`:

```csharp
var genOrder = Gen.Select(Gen.Int[1, 1000], Gen.Double[0.01, 9999.99],
    (qty, price) => new Order(qty, price));
```

Or LINQ query syntax for complex generators:

```csharp
var gen =
    from start in Gen.Long
    from end in Gen.Long
    let lo = Math.Min(start, end)
    let hi = Math.Max(start, end)
    from value in Gen.Long[lo, hi]
    select (value, lo, hi);
```

### Choosing a property strategy

Pick the **first** strategy that fits — listed from most to least efficient:

| Strategy | Method | When to use |
|---|---|---|
| **Model-based** | `SampleModelBased` | A simpler reference implementation exists (e.g., `HashSet<T>` for your custom set) |
| **Metamorphic** | `SampleMetamorphic` | No model exists, but two different code paths must produce the same result |
| **Round-trip** | `Sample` | Encode/decode, serialize/deserialize, parse/format pairs |
| **Invariant** | `Sample` | Output must always satisfy a condition (sorted, non-negative, length preserved) |
| **Idempotent** | `Sample` | Applying operation twice equals applying once |
| **Parallel** | `SampleParallel` | Thread-safe data structure or concurrent API — checks linearizability |
| **Performance** | `Faster` | Must prove one implementation is faster than another |

### Sample (basic properties)

Return `bool` (false = failure) or throw an exception:

```csharp
Gen.Int.Array.Sample(a =>
{
    var sorted = a.OrderBy(x => x).ToArray();
    return sorted.Length == a.Length; // invariant: length preserved
});
```

Configuration parameters — all optional:

```csharp
gen.Sample(property,
    iter: 10_000,              // iterations (default 100)
    time: 60,                  // run for N seconds (overrides iter)
    seed: "0N0XIzNsQ0O2",     // reproduce a specific failure
    threads: 1,               // parallelism (default: logical CPU count)
    print: t => t.ToString()  // custom failure message formatter
);
```

Global overrides via environment variables: `CsCheck_Iter`, `CsCheck_Time`, `CsCheck_Seed`, `CsCheck_Threads`.

### Classify

Return a `string` instead of `bool` to get a distribution table:

```csharp
Gen.Int.Array.Sample(a =>
    a.Length == 0 ? "empty"
    : a.Length < 10 ? "small"
    : "large",
    writeLine: TestContext.WriteLine);
```

Always classify when first writing a property — it reveals degenerate input distributions.

### Model-based testing

Generate an initial (actual, model) pair, then apply random operations to both and assert equality after each step:

```csharp
Gen.Const(() => (new MySet<int>(), new HashSet<int>()))
.SampleModelBased(
    Gen.Int.Operation<MySet<int>, HashSet<int>>(
        (actual, i) => actual.Add(i),
        (model, i) => model.Add(i)),
    Gen.Int.Operation<MySet<int>, HashSet<int>>(
        (actual, i) => actual.Remove(i),
        (model, i) => model.Remove(i)),
    Gen.Operation<MySet<int>, HashSet<int>>(
        actual => actual.Count,
        model => model.Count)
);
```

### Metamorphic testing

Two different ways of achieving the same result must agree:

```csharp
gen.SampleMetamorphic(
    Gen.Select(Gen.Int, Gen.Int).Metamorphic<MyCollection>(
        (c, t) => { c.Add(t.V0); c.Add(t.V1); },          // path A
        (c, t) => { c.Add(t.V1); c.Add(t.V0); })           // path B (order shouldn't matter)
);
```

### Parallel testing (linearizability)

Runs operations sequentially then in parallel, checks result matches at least one valid linearization:

```csharp
Gen.Const(() => new ConcurrentDictionary<int, int>())
.SampleParallel(
    Gen.Select(Gen.Int[0, 10], Gen.Int).Operation<ConcurrentDictionary<int, int>>(
        (d, t) => $"TryAdd({t.V0},{t.V1})",
        (d, t) => d.TryAdd(t.V0, t.V1)),
    Gen.Int[0, 10].Operation<ConcurrentDictionary<int, int>>(
        i => $"TryRemove({i})",
        (d, i) => d.TryRemove(i, out _))
);
```

### Performance comparison

Statistically proves the first function is faster. Runs are parallelized; stops when confidence is reached:

```csharp
gen.Faster(
    data => FastImpl(data),    // expected faster
    data => SlowImpl(data),    // expected slower
    sigma: 6,                  // confidence level (default 6)
    timeout: 60,               // seconds (default 60)
    writeLine: TestContext.WriteLine
);
```

### Regression pinning

`Single` finds and pins a generated example matching a predicate. `Hash` detects output changes without committing data files:

```csharp
var example = gen.Single(x => x.Items.Count == 5, "seedValue");
Check.Hash(h =>
{
    h.Add(Compute(example));
}, expectedHash, decimalPlaces: 2);
```

## Guidelines

- **Prefer constructive generation over filtering.** `Gen.Int[1, 100]` is better than `Gen.Int.Where(i => i > 0 && i <= 100)`. Filtering discards inputs and slows shrinking.
- **One property per test method.** Combining multiple assertions makes failures hard to diagnose.
- **Classify first.** When writing a new property, start with classification to verify your generator produces the distribution you expect.
- **Use `iter: 10_000` or `time:` for critical code.** The default 100 iterations may not be enough.
- **Don't ignore the seed.** When a test fails, CsCheck prints a seed string. Add it to the test as `seed:` to reproduce deterministically during debugging, then remove it before merging.
- **Use model-based testing for stateful code.** It's the most efficient strategy — a few operations fully exercise the state machine.
- **Use `SampleParallel` for anything claiming thread safety.** It finds race conditions that unit tests miss.
