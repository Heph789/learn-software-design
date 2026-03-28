---
title: "Content Management System"
difficulty: 3
---

## Context

You're building a CMS for a media company. Editors create articles, assign categories and tags, and publish on a schedule. The team wants draft/review/published workflow, revision history, and multi-author support.

## Schema

```sql
CREATE TABLE authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  role ENUM('writer','editor','admin')
);

CREATE TABLE articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL,
  title VARCHAR(500),
  slug VARCHAR(500) UNIQUE,
  body LONGTEXT,
  category VARCHAR(100),
  tags VARCHAR(500),          -- comma-separated: "tech,ai,startups"
  status ENUM('draft','review','published'),
  published_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);
```

## Issues

### Issue: Tags stored as comma-separated string
- **Category:** Normalization
- **Severity:** critical
- **Hint:** How do you query all articles with the tag 'AI' without false positives?

Comma-separated tags in a VARCHAR can't be indexed, joined, or queried efficiently. 'Find all articles tagged AI' requires LIKE '%ai%' which is slow and returns false positives ('fair'). You need a `tags` table and an `article_tags` join table for a proper many-to-many relationship.

### Issue: Single author_id — no multi-author support
- **Category:** Data Modeling
- **Severity:** critical
- **Hint:** The requirements say multi-author. How do two people co-author an article?

The context explicitly requires multi-author support, but there's only one `author_id` column. This needs an `article_authors` join table, ideally with an `author_role` column (primary author, contributor, editor) to capture the nature of each author's involvement.

### Issue: No revision history
- **Category:** Extensibility
- **Severity:** critical
- **Hint:** How do you see what this article looked like last Tuesday?

The requirements call for revision history, but the schema overwrites `body` and `title` in place. An `article_revisions` table storing (article_id, revision_number, title, body, edited_by, created_at) would let you diff versions and roll back.

### Issue: Category as a free-text string
- **Category:** Normalization
- **Severity:** major
- **Hint:** How do you rename a category across all articles atomically?

A plain VARCHAR for category means 'Technology', 'technology', and 'tech' are three different categories. A `categories` table with a FK on articles normalizes this, enables renaming a category in one place, and supports hierarchical categories (subcategories) later.

### Issue: Status workflow has no transition tracking
- **Category:** Workflow
- **Severity:** moderate
- **Hint:** Who approved this article for publication, and when?

The ENUM tracks current status but not transitions: who moved it from draft to review? When? Was it ever rejected back to draft? A `status_transitions` table or an editorial workflow log supports the review process the team wants.

### Issue: No index strategy for the public site
- **Category:** Performance
- **Severity:** moderate
- **Hint:** What indexes support 'show the 20 most recent published articles in Technology'?

The public-facing site needs to query published articles by category, sorted by published_at. Without indexes on (status, published_at) and (status, category), the most common pages (homepage, category pages) will be slow.
