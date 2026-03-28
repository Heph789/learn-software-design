---
title: "SaaS Multi-Tenant Permissions"
---

## Context

You're building a B2B SaaS app where companies (tenants) invite team members. Users can have different roles (admin, editor, viewer). The team plans to add granular per-resource permissions and audit logging soon.

## Schema

```sql
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  plan VARCHAR(50)         -- "free","pro","enterprise"
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL,  -- "admin","editor","viewer"
  name VARCHAR(100),
  created_at DATETIME
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(255),
  content LONGTEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
);
```

## Issues

### Issue: Role is a single column — can't scale to granular permissions
- **Category:** Extensibility
- **Severity:** critical
- **Hint:** What happens when the same user needs different access levels on different documents?

A single `role` string on the users table means one role per user, globally. You can't express 'editor on Project A but viewer on Project B.' This needs a many-to-many relationship: a `user_roles` or `permissions` table linking users to roles on specific resources.

### Issue: No tenant isolation on queries
- **Category:** Multi-Tenancy
- **Severity:** critical
- **Hint:** What prevents a query bug from showing Company A's documents to Company B?

There's no composite index on (company_id, id) for documents, and no enforced pattern ensuring every query filters by company_id. A bug in application code could leak documents across tenants. Consider making company_id part of composite keys or using row-level security.

### Issue: Users locked to a single company
- **Category:** Data Modeling
- **Severity:** major
- **Hint:** Can a freelancer who works with three of your clients use one login?

The `company_id` directly on the users table means a person can only belong to one company. In B2B SaaS, consultants and agency users often need access to multiple tenants. A `memberships` join table solves this.

### Issue: Soft delete without supporting infrastructure
- **Category:** Soft Delete
- **Severity:** moderate
- **Hint:** How many of your queries will forget to filter out deleted documents?

The `is_deleted` flag on documents means every query must remember to add `WHERE is_deleted = FALSE`. Without a partial index on non-deleted rows, you're also scanning dead rows constantly. There's also no `deleted_at` timestamp for auditing or retention policies.

### Issue: No audit trail for changes
- **Category:** Audit
- **Severity:** moderate
- **Hint:** The roadmap says 'audit logging soon' — what's missing to support that?

With plans for audit logging, the schema has no `updated_by` on documents and no event/history table. You'll need to retrofit this later, which usually means backfilling incomplete data. Design the audit table now even if you populate it later.

### Issue: No UNIQUE constraint on (company_id, email) for invitations
- **Category:** Integrity
- **Severity:** moderate
- **Hint:** What constraints protect the relationship between users and companies?

The email is globally unique, but there's no protection against a user being associated with the wrong company. If you move to a memberships model, you'll need a unique constraint on (user_id, company_id) to prevent duplicate memberships.
