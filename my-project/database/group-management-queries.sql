-- Quick Reference SQL Queries for Dynamic Contact Groups
-- Use these for common operations instead of API calls

-- ====================
-- 1. GROUP MANAGEMENT
-- ====================

-- List all active groups with contact counts
SELECT 
    cg.id,
    cg.name,
    cg.description,
    COUNT(c.id) as contact_count,
    cg.created_at
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.is_active = TRUE
GROUP BY cg.id, cg.name, cg.description, cg.created_at
ORDER BY cg.name ASC;

-- Add a new group
INSERT INTO contact_groups (name, description) 
VALUES ('New Group Name', 'Group description here');

-- Update a group (and all contacts using it)
START TRANSACTION;
UPDATE contacts SET group_name = 'Updated Group Name' WHERE group_name = 'Old Group Name';
UPDATE contact_groups SET name = 'Updated Group Name', description = 'Updated description' WHERE name = 'Old Group Name';
COMMIT;

-- Delete a group (only if no contacts use it)
DELETE FROM contact_groups 
WHERE name = 'Group Name To Delete' 
AND id NOT IN (
    SELECT DISTINCT cg.id 
    FROM contact_groups cg 
    INNER JOIN contacts c ON c.group_name = cg.name 
    WHERE cg.name = 'Group Name To Delete'
);

-- ====================
-- 2. CONTACT OPERATIONS
-- ====================

-- Get all contacts with their groups
SELECT id, name, email, phone, group_name, created_at
FROM contacts 
ORDER BY group_name, name;

-- Get contacts by specific group
SELECT id, name, email, phone, notes
FROM contacts 
WHERE group_name = 'Companies'
ORDER BY name;

-- Get contacts from multiple groups (for email sending)
SELECT id, name, email, group_name
FROM contacts 
WHERE group_name IN ('Companies', 'Private', 'Schools')
ORDER BY group_name, name;

-- Add new contact with group validation
INSERT INTO contacts (name, email, phone, `group`, group_name, notes, opt1, opt2, opt3)
SELECT 'Contact Name', 'email@example.com', '123456789', 'Companies', 'Companies', 'Notes here', 1, 1, 1
WHERE EXISTS (SELECT 1 FROM contact_groups WHERE name = 'Companies' AND is_active = TRUE);

-- ====================
-- 3. EMAIL SENDING SUPPORT  
-- ====================

-- Get all available groups for email sending dropdown
SELECT name FROM contact_groups WHERE is_active = TRUE ORDER BY name;

-- Simulate email recipient collection (like send-email page)
-- Individual contacts + Group contacts
(SELECT id, name, email, 'individual' as selection_type
 FROM contacts 
 WHERE id IN (2, 3, 5))  -- Replace with actual selected contact IDs
UNION ALL
(SELECT id, name, email, 'group' as selection_type
 FROM contacts 
 WHERE group_name IN ('Companies', 'Schools'));  -- Replace with selected groups

-- Count total recipients for email campaign
SELECT COUNT(*) as total_recipients
FROM (
    SELECT id FROM contacts WHERE id IN (2, 3, 5)  -- Individual contacts
    UNION
    SELECT id FROM contacts WHERE group_name IN ('Companies', 'Schools')  -- Group contacts
) as recipients;

-- ====================
-- 4. VALIDATION QUERIES
-- ====================

-- Check if group name already exists (before creating)
SELECT COUNT(*) as exists_count 
FROM contact_groups 
WHERE name = 'New Group Name' AND is_active = TRUE;

-- Check if group can be safely deleted
SELECT 
    cg.name,
    COUNT(c.id) as contact_count,
    CASE WHEN COUNT(c.id) = 0 THEN 'CAN DELETE' ELSE 'CANNOT DELETE' END as status
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.name = 'Group Name'
GROUP BY cg.name;

-- Validate contact group before insert/update
SELECT COUNT(*) as valid_group
FROM contact_groups 
WHERE name = 'Group Name' AND is_active = TRUE;

-- ====================
-- 5. MIGRATION & MAINTENANCE
-- ====================

-- Ensure all contacts have group_name populated
UPDATE contacts 
SET group_name = `group` 
WHERE group_name IS NULL AND `group` IS NOT NULL;

-- Find contacts with invalid groups
SELECT id, name, email, group_name
FROM contacts c
WHERE group_name IS NOT NULL 
AND group_name NOT IN (SELECT name FROM contact_groups WHERE is_active = TRUE);

-- Fix orphaned contacts (set to default group)
UPDATE contacts 
SET group_name = 'Private' 
WHERE group_name NOT IN (SELECT name FROM contact_groups WHERE is_active = TRUE);

-- ====================
-- 6. REPORTING QUERIES
-- ====================

-- Group statistics
SELECT 
    cg.name as group_name,
    COUNT(c.id) as contact_count,
    MIN(c.created_at) as oldest_contact,
    MAX(c.created_at) as newest_contact
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.is_active = TRUE
GROUP BY cg.id, cg.name
ORDER BY contact_count DESC;

-- Recent contacts by group
SELECT group_name, COUNT(*) as recent_contacts
FROM contacts 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY group_name
ORDER BY recent_contacts DESC;