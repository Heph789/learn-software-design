---
title: "Your Scenario Title"
---

## Context

Describe the business situation in 2-3 sentences. What is being built, who are the users, and what features are planned next? The planned features should hint at issues the current schema can't support.

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
- **Hint:** A question that nudges the reviewer toward this issue without giving it away.

Write 2-4 sentences explaining why this is a problem and what a better design looks like.

### Issue: Another issue title
- **Category:** Performance
- **Severity:** moderate
- **Hint:** Another guiding question.

Explanation for the second issue.
