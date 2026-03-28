export interface Issue {
  category: string;
  severity: "critical" | "major" | "moderate";
  title: string;
  explanation: string;
  hint: string;
}

export interface Scenario {
  id: number;
  title: string;
  context: string;
  schema: string;
  issues: Issue[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "E-Commerce Orders",
    context: "You're building an online store. Customers place orders containing multiple products. The team wants to show order history, calculate revenue per product, and eventually support discount codes.",
    schema: `CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255),
  address TEXT
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  products TEXT,        -- JSON: [{"name":"Widget","price":9.99,"qty":2}]
  total DECIMAL(10,2),
  status VARCHAR(20),   -- "pending","shipped","delivered","cancelled"
  created_at DATETIME
);`,
    issues: [
      {
        category: "Normalization",
        severity: "critical",
        title: "Products stuffed into a JSON blob",
        explanation: "Storing line items as a JSON string in `products` means you can't query revenue per product, enforce referential integrity, or update a product's price independently. This should be a separate `order_items` table with foreign keys to both `orders` and a `products` table.",
        hint: "What happens when you need to answer 'what's our best-selling product this quarter'?"
      },
      {
        category: "Extensibility",
        severity: "major",
        title: "No standalone products table",
        explanation: "Product data is duplicated inside every order's JSON. There's no canonical source of truth for product catalog info (description, current price, inventory). A `products` table is essential for any real store.",
        hint: "Where does the product catalog live?"
      },
      {
        category: "Integrity",
        severity: "major",
        title: "No FOREIGN KEY constraint on user_id",
        explanation: "Without a FK constraint, you can insert orders referencing non-existent users. The database won't protect you from orphaned records.",
        hint: "What prevents an order from pointing to a deleted user?"
      },
      {
        category: "Data Modeling",
        severity: "moderate",
        title: "Address stored as single TEXT field",
        explanation: "A single `address` field can't support shipping vs. billing addresses, multiple saved addresses, or structured address validation. Users typically have multiple addresses over time, and orders need to snapshot the address at time of purchase.",
        hint: "What happens when a user moves but you need the old shipping address for a past order?"
      },
      {
        category: "Extensibility",
        severity: "moderate",
        title: "Status as a free-text string with no constraint",
        explanation: "Without a CHECK constraint or enum, any typo ('Shiped', 'canelled') becomes a valid status. As the system grows, you'll also want status transition timestamps — a separate `order_status_history` table lets you track when each transition happened.",
        hint: "How do you prevent invalid status values?"
      },
      {
        category: "Performance",
        severity: "moderate",
        title: "No indexes beyond the primary keys",
        explanation: "Querying orders by user_id (order history) or by status (admin dashboard) will require full table scans. These are obvious index candidates.",
        hint: "How will the 'my orders' page perform at 10 million rows?"
      }
    ]
  },
  {
    id: 2,
    title: "SaaS Multi-Tenant Permissions",
    context: "You're building a B2B SaaS app where companies (tenants) invite team members. Users can have different roles (admin, editor, viewer). The team plans to add granular per-resource permissions and audit logging soon.",
    schema: `CREATE TABLE companies (
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
);`,
    issues: [
      {
        category: "Extensibility",
        severity: "critical",
        title: "Role is a single column — can't scale to granular permissions",
        explanation: "A single `role` string on the users table means one role per user, globally. You can't express 'editor on Project A but viewer on Project B.' This needs a many-to-many relationship: a `user_roles` or `permissions` table linking users to roles on specific resources.",
        hint: "What happens when the same user needs different access levels on different documents?"
      },
      {
        category: "Multi-Tenancy",
        severity: "critical",
        title: "No tenant isolation on queries",
        explanation: "There's no composite index on (company_id, id) for documents, and no enforced pattern ensuring every query filters by company_id. A bug in application code could leak documents across tenants. Consider making company_id part of composite keys or using row-level security.",
        hint: "What prevents a query bug from showing Company A's documents to Company B?"
      },
      {
        category: "Data Modeling",
        severity: "major",
        title: "Users locked to a single company",
        explanation: "The `company_id` directly on the users table means a person can only belong to one company. In B2B SaaS, consultants and agency users often need access to multiple tenants. A `memberships` join table solves this.",
        hint: "Can a freelancer who works with three of your clients use one login?"
      },
      {
        category: "Soft Delete",
        severity: "moderate",
        title: "Soft delete without supporting infrastructure",
        explanation: "The `is_deleted` flag on documents means every query must remember to add `WHERE is_deleted = FALSE`. Without a partial index on non-deleted rows, you're also scanning dead rows constantly. There's also no `deleted_at` timestamp for auditing or retention policies.",
        hint: "How many of your queries will forget to filter out deleted documents?"
      },
      {
        category: "Audit",
        severity: "moderate",
        title: "No audit trail for changes",
        explanation: "With plans for audit logging, the schema has no `updated_by` on documents and no event/history table. You'll need to retrofit this later, which usually means backfilling incomplete data. Design the audit table now even if you populate it later.",
        hint: "The roadmap says 'audit logging soon' — what's missing to support that?"
      },
      {
        category: "Integrity",
        severity: "moderate",
        title: "No UNIQUE constraint on (company_id, email) for invitations",
        explanation: "The email is globally unique, but there's no protection against a user being associated with the wrong company. If you move to a memberships model, you'll need a unique constraint on (user_id, company_id) to prevent duplicate memberships.",
        hint: "What constraints protect the relationship between users and companies?"
      }
    ]
  },
  {
    id: 3,
    title: "Social Feed with Comments",
    context: "You're building a social platform. Users create posts, other users comment on them. The product team wants to add threaded/nested replies, reactions (like, love, laugh), and a notification system next quarter.",
    schema: `CREATE TABLE users (
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
);`,
    issues: [
      {
        category: "Extensibility",
        severity: "critical",
        title: "No support for threaded replies",
        explanation: "Comments have no `parent_comment_id` column. Adding nested replies later means either altering this table (and migrating data) or building a second table. A nullable self-referential FK (`parent_id BIGINT REFERENCES comments(id)`) is the standard approach for threaded comments.",
        hint: "The roadmap says threaded replies next quarter. How would you query a reply chain right now?"
      },
      {
        category: "Data Modeling",
        severity: "critical",
        title: "Reactions hardcoded as a counter column",
        explanation: "`likes_count` is a denormalized counter with no backing table tracking *who* liked *what*. You can't un-like, can't prevent double-likes, and can't extend to other reaction types (love, laugh). You need a `reactions` table: (user_id, post_id, reaction_type) with a unique constraint.",
        hint: "How do you know if the current user already liked this post? How do you add 'love' and 'laugh' reactions?"
      },
      {
        category: "Consistency",
        severity: "major",
        title: "Denormalized counters with no sync mechanism",
        explanation: "`likes_count` and `comments_count` on posts will drift from reality over time unless you have triggers, a transactional update pattern, or a periodic reconciliation job. These counters are fine for performance, but the schema doesn't show how they stay accurate.",
        hint: "What happens to comments_count when a comment is deleted?"
      },
      {
        category: "Extensibility",
        severity: "major",
        title: "No polymorphic target for notifications",
        explanation: "The planned notification system needs to reference different entity types: 'X liked your post', 'Y replied to your comment.' Without a notifications table designed to reference polymorphic targets (post or comment), you'll end up with nullable columns or a messy workaround.",
        hint: "How would a notifications table know whether to link to a post or a comment?"
      },
      {
        category: "Performance",
        severity: "moderate",
        title: "Feed query will be expensive",
        explanation: "A user's feed ('posts from people I follow') requires a follows relationship that doesn't exist here, plus an efficient way to query it. Even for a simple 'latest posts' feed, there's no index on `created_at` for chronological pagination.",
        hint: "How does the home feed query work? What index supports 'show me recent posts'?"
      },
      {
        category: "Data Modeling",
        severity: "moderate",
        title: "No media or attachments support",
        explanation: "Posts only have a `body` text field. Most social platforms support images, videos, or link previews. A separate `post_media` table would allow multiple attachments per post without altering the posts table.",
        hint: "Where do images or videos go?"
      }
    ]
  },
  {
    id: 4,
    title: "Booking & Scheduling System",
    context: "You're building a scheduling app for a clinic. Patients book appointments with doctors. Each doctor has weekly availability. The team needs to prevent double-bookings, support appointment cancellations, and show a daily schedule view.",
    schema: `CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  specialty VARCHAR(100),
  email VARCHAR(255),
  availability TEXT  -- JSON: {"mon":"9-17","tue":"9-17","wed":"9-13",...}
);

CREATE TABLE patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE
);

CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT,
  patient_id INT,
  date DATE,
  time TIME,
  duration INT DEFAULT 30,
  notes TEXT,
  cancelled BOOLEAN DEFAULT FALSE
);`,
    issues: [
      {
        category: "Integrity",
        severity: "critical",
        title: "No mechanism to prevent double-booking",
        explanation: "Nothing in this schema prevents two patients from booking the same doctor at the same time. You need either a UNIQUE constraint on (doctor_id, date, time) for fixed slots, or an exclusion constraint / application-level check for variable-length appointments that overlap. This is the core business rule and the database should enforce it.",
        hint: "What stops two patients from booking Dr. Smith at 2pm on Tuesday?"
      },
      {
        category: "Normalization",
        severity: "critical",
        title: "Availability stored as JSON in a text field",
        explanation: "JSON availability can't be queried, validated, or joined against. 'Does Dr. Smith work Thursdays?' requires parsing JSON in application code. A structured `doctor_availability` table with (doctor_id, day_of_week, start_time, end_time) is queryable, indexable, and supports exceptions like holidays.",
        hint: "How do you query 'which doctors are available Thursday afternoon'?"
      },
      {
        category: "Data Modeling",
        severity: "major",
        title: "Cancelled as a boolean loses history",
        explanation: "A boolean `cancelled` flag doesn't capture when the cancellation happened, who cancelled (doctor or patient), or the reason. For a clinic, cancellation patterns matter (no-show tracking, rebooking). A `status` field with a separate `appointment_status_history` table is more robust.",
        hint: "Was this a no-show or a patient cancellation? When did it happen?"
      },
      {
        category: "Integrity",
        severity: "major",
        title: "No foreign key constraints",
        explanation: "Neither `doctor_id` nor `patient_id` on appointments has a FOREIGN KEY constraint. Orphaned appointments referencing deleted doctors or patients will corrupt the daily schedule view.",
        hint: "What happens to the schedule if a doctor record is deleted?"
      },
      {
        category: "Performance",
        severity: "moderate",
        title: "No index for the daily schedule view",
        explanation: "The daily schedule view needs to query appointments by doctor and date. Without a composite index on (doctor_id, date), this query scans the entire appointments table. This is the most common query in the system.",
        hint: "What index supports 'show me Dr. Smith's appointments for March 15'?"
      },
      {
        category: "Extensibility",
        severity: "moderate",
        title: "No appointment type or service concept",
        explanation: "All appointments are treated identically. Clinics typically have different visit types (checkup, follow-up, procedure) with different durations and prices. A `services` table linked to appointments would support this without changing the appointments schema later.",
        hint: "Is a 15-minute follow-up the same as a 60-minute procedure?"
      }
    ]
  },
  {
    id: 5,
    title: "Content Management System",
    context: "You're building a CMS for a media company. Editors create articles, assign categories and tags, and publish on a schedule. The team wants draft/review/published workflow, revision history, and multi-author support.",
    schema: `CREATE TABLE authors (
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
);`,
    issues: [
      {
        category: "Normalization",
        severity: "critical",
        title: "Tags stored as comma-separated string",
        explanation: "Comma-separated tags in a VARCHAR can't be indexed, joined, or queried efficiently. 'Find all articles tagged AI' requires LIKE '%ai%' which is slow and returns false positives ('fair'). You need a `tags` table and an `article_tags` join table for a proper many-to-many relationship.",
        hint: "How do you query all articles with the tag 'AI' without false positives?"
      },
      {
        category: "Data Modeling",
        severity: "critical",
        title: "Single author_id — no multi-author support",
        explanation: "The context explicitly requires multi-author support, but there's only one `author_id` column. This needs an `article_authors` join table, ideally with an `author_role` column (primary author, contributor, editor) to capture the nature of each author's involvement.",
        hint: "The requirements say multi-author. How do two people co-author an article?"
      },
      {
        category: "Extensibility",
        severity: "critical",
        title: "No revision history",
        explanation: "The requirements call for revision history, but the schema overwrites `body` and `title` in place. An `article_revisions` table storing (article_id, revision_number, title, body, edited_by, created_at) would let you diff versions and roll back.",
        hint: "How do you see what this article looked like last Tuesday?"
      },
      {
        category: "Normalization",
        severity: "major",
        title: "Category as a free-text string",
        explanation: "A plain VARCHAR for category means 'Technology', 'technology', and 'tech' are three different categories. A `categories` table with a FK on articles normalizes this, enables renaming a category in one place, and supports hierarchical categories (subcategories) later.",
        hint: "How do you rename a category across all articles atomically?"
      },
      {
        category: "Workflow",
        severity: "moderate",
        title: "Status workflow has no transition tracking",
        explanation: "The ENUM tracks current status but not transitions: who moved it from draft to review? When? Was it ever rejected back to draft? A `status_transitions` table or an editorial workflow log supports the review process the team wants.",
        hint: "Who approved this article for publication, and when?"
      },
      {
        category: "Performance",
        severity: "moderate",
        title: "No index strategy for the public site",
        explanation: "The public-facing site needs to query published articles by category, sorted by published_at. Without indexes on (status, published_at) and (status, category), the most common pages (homepage, category pages) will be slow.",
        hint: "What indexes support 'show the 20 most recent published articles in Technology'?"
      }
    ]
  }
];

export default SCENARIOS;
