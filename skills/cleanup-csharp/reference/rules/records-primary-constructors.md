# Records and primary constructors

Use records and primary constructors at every opportunity.
They make code easier to read.

---

Bad:

```cs
internal class Car
{
    public string Make { get; set; }
    public string Model { get; set; }
}
```

Good:

```cs
internal record Car(string Make, string Model);
```

---

Bad:

```cs
```

Good:

```cs
```
