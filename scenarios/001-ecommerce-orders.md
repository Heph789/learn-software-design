---
title: "E-Commerce Orders"
---

## Context

You're building an online store. Customers place orders containing multiple products. The team wants to show order history, calculate revenue per product, and eventually support discount codes.

## Schema

```sql
CREATE TABLE users (
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
);
```

## Issues

### Issue: Products stuffed into a JSON blob
- **Category:** Normalization
- **Severity:** critical
- **Hint:** What happens when you need to answer 'what's our best-selling product this quarter'?

Storing line items as a JSON string in `products` means you can't query revenue per product, enforce referential integrity, or update a product's price independently. This should be a separate `order_items` table with foreign keys to both `orders` and a `products` table.

### Issue: No standalone products table
- **Category:** Extensibility
- **Severity:** major
- **Hint:** Where does the product catalog live?

Product data is duplicated inside every order's JSON. There's no canonical source of truth for product catalog info (description, current price, inventory). A `products` table is essential for any real store.

### Issue: No FOREIGN KEY constraint on user_id
- **Category:** Integrity
- **Severity:** major
- **Hint:** What prevents an order from pointing to a deleted user?

Without a FK constraint, you can insert orders referencing non-existent users. The database won't protect you from orphaned records.

### Issue: Address stored as single TEXT field
- **Category:** Data Modeling
- **Severity:** moderate
- **Hint:** What happens when a user moves but you need the old shipping address for a past order?

A single `address` field can't support shipping vs. billing addresses, multiple saved addresses, or structured address validation. Users typically have multiple addresses over time, and orders need to snapshot the address at time of purchase.

### Issue: Status as a free-text string with no constraint
- **Category:** Extensibility
- **Severity:** moderate
- **Hint:** How do you prevent invalid status values?

Without a CHECK constraint or enum, any typo ('Shiped', 'canelled') becomes a valid status. As the system grows, you'll also want status transition timestamps — a separate `order_status_history` table lets you track when each transition happened.

### Issue: No indexes beyond the primary keys
- **Category:** Performance
- **Severity:** moderate
- **Hint:** How will the 'my orders' page perform at 10 million rows?

Querying orders by user_id (order history) or by status (admin dashboard) will require full table scans. These are obvious index candidates.
