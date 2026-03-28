# Schema Review Practice

Practice spotting design issues in SQL schemas. Read the product context, study the DDL, write down every problem you can find, then reveal the answers to check your work.

## Contributing a scenario

The best way to contribute is by adding a new scenario. Each scenario is a real-world-ish feature with an intentionally flawed schema and a set of issues for the reviewer to find.

You don't need to write any TypeScript -- just create a markdown file.

### 1. Fork and clone

```sh
git clone <your-fork-url>
cd learn-software-design
npm install
```

### 2. Create a scenario file

Copy the template and give it the next available number:

```sh
cp scenarios/_template.md scenarios/006-your-scenario.md
```

Fill in the sections. Here's the format:

```markdown
---
title: "Short Nav Label"
---

## Context

2-3 sentences: what the team is building, who the users are,
and what features are planned next.

## Schema

```sql
CREATE TABLE example (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100)
);
```

## Issues

### Issue: Short issue title
- **Category:** Normalization
- **Severity:** critical
- **Hint:** A question that nudges the reviewer toward the problem.

2-4 sentences explaining why this is a problem and what a better design looks like.
```

See `scenarios/_template.md` for a full starter file, or any existing scenario for reference.

**Guidelines for good scenarios:**

- **Pick a real domain** -- e-commerce, healthcare, social, fintech, etc.
- **Include product context** that hints at future requirements the schema doesn't support.
- **Aim for 4-7 issues** with a mix of severities (`critical`, `major`, `moderate`).
- **Make the schema look plausible** -- it should be the kind of thing a junior engineer might actually write.
- **Write hints as questions**, not statements. They should make the reviewer think, not give the answer.

### 3. Generate and test

```sh
npm run generate   # parses your markdown into src/data/scenarios.ts
npm run dev        # start the dev server and check your scenario
```

The generate script validates your file and will print errors if anything is missing or malformed.

### 4. Open a PR

Commit both your new `scenarios/*.md` file and the updated `src/data/scenarios.ts`, then open a pull request. CI will verify the generated file is up to date.
