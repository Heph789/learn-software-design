---
title: "Booking & Scheduling System"
difficulty: 1
---

## Context

You're building a scheduling app for a clinic. Patients book appointments with doctors. Each doctor has weekly availability. The team needs to prevent double-bookings, support appointment cancellations, and show a daily schedule view.

## Schema

```sql
CREATE TABLE doctors (
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
);
```

## Issues

### Issue: No mechanism to prevent double-booking
- **Category:** Integrity
- **Severity:** critical
- **Hint:** What stops two patients from booking Dr. Smith at 2pm on Tuesday?

Nothing in this schema prevents two patients from booking the same doctor at the same time. You need either a UNIQUE constraint on (doctor_id, date, time) for fixed slots, or an exclusion constraint / application-level check for variable-length appointments that overlap. This is the core business rule and the database should enforce it.

### Issue: Availability stored as JSON in a text field
- **Category:** Normalization
- **Severity:** critical
- **Hint:** How do you query 'which doctors are available Thursday afternoon'?

JSON availability can't be queried, validated, or joined against. 'Does Dr. Smith work Thursdays?' requires parsing JSON in application code. A structured `doctor_availability` table with (doctor_id, day_of_week, start_time, end_time) is queryable, indexable, and supports exceptions like holidays.

### Issue: Cancelled as a boolean loses history
- **Category:** Data Modeling
- **Severity:** major
- **Hint:** Was this a no-show or a patient cancellation? When did it happen?

A boolean `cancelled` flag doesn't capture when the cancellation happened, who cancelled (doctor or patient), or the reason. For a clinic, cancellation patterns matter (no-show tracking, rebooking). A `status` field with a separate `appointment_status_history` table is more robust.

### Issue: No foreign key constraints
- **Category:** Integrity
- **Severity:** major
- **Hint:** What happens to the schedule if a doctor record is deleted?

Neither `doctor_id` nor `patient_id` on appointments has a FOREIGN KEY constraint. Orphaned appointments referencing deleted doctors or patients will corrupt the daily schedule view.

### Issue: No index for the daily schedule view
- **Category:** Performance
- **Severity:** moderate
- **Hint:** What index supports 'show me Dr. Smith's appointments for March 15'?

The daily schedule view needs to query appointments by doctor and date. Without a composite index on (doctor_id, date), this query scans the entire appointments table. This is the most common query in the system.

### Issue: No appointment type or service concept
- **Category:** Extensibility
- **Severity:** moderate
- **Hint:** Is a 15-minute follow-up the same as a 60-minute procedure?

All appointments are treated identically. Clinics typically have different visit types (checkup, follow-up, procedure) with different durations and prices. A `services` table linked to appointments would support this without changing the appointments schema later.
