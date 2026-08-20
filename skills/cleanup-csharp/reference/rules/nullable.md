# Nullable

## Use null pattern matching

Bad:

```cs name=null-pattern-matching-before.cs
if (customer == null)
{
    return;
}

if (customer.Address != null)
{
    SendMail(customer.Address);
}
```

Good:

```cs name=null-pattern-matching-after.cs
if (customer is null)
{
    return;
}

if (customer.Address is not null)
{
    SendMail(customer.Address);
}
```

---

## Use null-conditional access

Bad:

```cs name=null-conditional-access-before.cs
string? city = null;

if (customer is not null && customer.Address is not null)
{
    city = customer.Address.City;
}
```

Good:

```cs name=null-conditional-access-after.cs
string? city = customer?.Address?.City;
```

---

## Use null-conditional assignment

Bad:

```cs name=null-conditional-assignment-before.cs
if (customer is not null)
{
    customer.CurrentOrder = GetCurrentOrder();
}
```

Good:

```cs name=null-conditional-assignment-after.cs
customer?.CurrentOrder = GetCurrentOrder();
```

---

## Use null-coalescing operator

Bad:

```cs name=null-coalescing-before.cs
string displayName;

if (user.DisplayName is null)
{
    displayName = "Anonymous";
}
else
{
    displayName = user.DisplayName;
}
```

Good:

```cs name=null-coalescing-after.cs
string displayName = user.DisplayName ?? "Anonymous";
```

---

## Use null-coalescing assignment

Bad:

```cs name=null-coalescing-assignment-before.cs
if (settings.Theme is null)
{
    settings.Theme = CreateDefaultTheme();
}
```

Good:

```cs name=null-coalescing-assignment-after.cs
settings.Theme ??= CreateDefaultTheme();
```
