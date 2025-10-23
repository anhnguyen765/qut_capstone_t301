-- Migration to add UNIQUE constraint to contacts.email
-- This will prevent duplicate emails at the database level

-- First, remove any existing duplicate emails (keep the first one)
DELETE c1 FROM contacts c1
INNER JOIN contacts c2 
WHERE c1.id > c2.id 
AND c1.email = c2.email;

-- Add UNIQUE constraint to email field
ALTER TABLE contacts ADD UNIQUE KEY unique_email (email);

-- Verify the constraint was added
SHOW INDEX FROM contacts WHERE Key_name = 'unique_email';