---
name: find-red-flags
description: Find red flags in a codebase or a diff. Use only when explicitly invoked.
---

# Finding red flags in code

The operator is asking you to find red flags in a codebase or a diff.
Scan through the requested code looking for the following red flags.
Report the red flags you find in a table along with a brief explanation for each red flag.

## Modules should be deep

### Red Flag: Shallow Module
A shallow module is one whose interface is complicated relative to the functionality it provides.
Shallow modules don't help much in the battle against complexity, because the benefit they provide (not having to learn about how they work internally) is negated by the cost of learning and using their interfaces.
Small modules tend to be shallow.

## Information hiding / encapsulation

### Red Flag: Information Leakage
Information leakage occurs when the same knowledge is used in multiple places, such as two different classes that both understand the format of a particular type of file.

### Red Flag: Temporal Decomposition
In temporal decomposition, execution order is reflected in the code structure: operations that happen at different times are in different methods or classes.
If the same knowledge is used at different points in execution, it gets encoded in multiple places, resulting in information leakage.

### Red Flag: Overexposure
If the API for a commonly used feature forces users to learn about other features that are rarely used, this increases the cognitive load on users who don't need the rarely used features.

## Abstractions

### Red Flag: Pass-Through Method
A pass-through method is one that does nothing except pass its arguments to another method, usually with the same API as the pass-through method.
This typically indicates that there is not a clean division of responsibility between the classes.

### Red Flag: Repetition
If the same piece of code (or code that is almost the same) appears over and over again, that's a red flag that you haven't found the right abstractions.

### Red Flag: Special/General Mixture
This red flag occurs when a general-purpose mechanism also contains code specialized for a particular use of that mechanism.
This makes the mechanism more complicated and creates information leakage between the mechanism and the particular use case: future modifications to the use case are likely to require changes to the underlying mechanism as well.

### Red Flag: Conjoined Methods
It should be possible to understand each method independently.
If you can't understand the implementation of one method without also understanding the implementation of another, that's a red flag.
This red flag can occur in other contexts as well: if two pieces of code are physically separated, but each can only be understood by looking at the other, that is a red flag.

## Comments

### Red Flag: Comment Repeats Code
If the information in a comment is already obvious from the code next to the comment, then the comment isn't helpful.
One example of this is when the comment uses the same words that make up the name of the thing it is describing.

### Red Flag: Implementation Documentation Contaminates Interface
This red flag occurs when interface documentation, such as that for a method, describes implementation details that aren't needed in order to use the thing being documented.

### Red Flag: Hard to Describe
The comment that describes a method or variable should be simple and yet complete.
If you find it difficult to write such a comment, that's an indicator that there may be a problem with the design of the thing you are describing.

## Names

### Red Flag: Vague Name
If a variable or method name is broad enough to refer to many different things, then it doesn't convey much information to the developer and the underlying entity is more likely to be misused.

### Red Flag: Hard to Pick Name
If it's hard to find a simple name for a variable or method that creates a clear image of the underlying object, that's a hint that the underlying object may not have a clean design.

## Code

### Red Flag: Nonobvious Code
If the meaning and behavior of code cannot be understood with a quick reading, it is a red flag.
Often this means that there is important information that is not immediately clear to someone reading the code.
