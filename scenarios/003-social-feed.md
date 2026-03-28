---
title: "Social Feed with Comments"
---

## Context

You're building a social platform. Users create posts, other users comment on them. The product team wants to add threaded/nested replies, reactions (like, love, laugh), and a notification system next quarter.

## Schema

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  body TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Issues

### Issue: No support for threaded replies
- **Category:** Extensibility
- **Severity:** critical
- **Hint:** The roadmap says threaded replies next quarter. How would you query a reply chain right now?

Comments have no `parent_comment_id` column. Adding nested replies later means either altering this table (and migrating data) or building a second table. A nullable self-referential FK (`parent_id BIGINT REFERENCES comments(id)`) is the standard approach for threaded comments.

### Issue: Reactions hardcoded as a counter column
- **Category:** Data Modeling
- **Severity:** critical
- **Hint:** How do you know if the current user already liked this post? How do you add 'love' and 'laugh' reactions?

`likes_count` is a denormalized counter with no backing table tracking *who* liked *what*. You can't un-like, can't prevent double-likes, and can't extend to other reaction types (love, laugh). You need a `reactions` table: (user_id, post_id, reaction_type) with a unique constraint.

### Issue: Denormalized counters with no sync mechanism
- **Category:** Consistency
- **Severity:** major
- **Hint:** What happens to comments_count when a comment is deleted?

`likes_count` and `comments_count` on posts will drift from reality over time unless you have triggers, a transactional update pattern, or a periodic reconciliation job. These counters are fine for performance, but the schema doesn't show how they stay accurate.

### Issue: No polymorphic target for notifications
- **Category:** Extensibility
- **Severity:** major
- **Hint:** How would a notifications table know whether to link to a post or a comment?

The planned notification system needs to reference different entity types: 'X liked your post', 'Y replied to your comment.' Without a notifications table designed to reference polymorphic targets (post or comment), you'll end up with nullable columns or a messy workaround.

### Issue: Feed query will be expensive
- **Category:** Performance
- **Severity:** moderate
- **Hint:** How does the home feed query work? What index supports 'show me recent posts'?

A user's feed ('posts from people I follow') requires a follows relationship that doesn't exist here, plus an efficient way to query it. Even for a simple 'latest posts' feed, there's no index on `created_at` for chronological pagination.

### Issue: No media or attachments support
- **Category:** Data Modeling
- **Severity:** moderate
- **Hint:** Where do images or videos go?

Posts only have a `body` text field. Most social platforms support images, videos, or link previews. A separate `post_media` table would allow multiple attachments per post without altering the posts table.
