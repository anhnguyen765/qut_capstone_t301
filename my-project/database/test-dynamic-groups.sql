-- Dynamic Contact Groups - SQL Testing Queries
-- Run these queries directly in your database to test the functionality

-- 1. VERIFY SETUP
-- Check that contact_groups table exists and has data
SELECT 'Contact Groups Setup:' as test_section;
SELECT * FROM contact_groups WHERE is_active = TRUE ORDER BY name;

-- Check that contacts have group_name populated
SELECT 'Contact Group Migration:' as test_section;
SELECT COUNT(*) as total_contacts, 
       COUNT(group_name) as contacts_with_group_name,
       COUNT(`group`) as contacts_with_group_enum
FROM contacts;

-- Show sample contacts with both group fields
SELECT 'Sample Contacts:' as test_section;
SELECT id, name, email, `group` as old_group, group_name as new_group 
FROM contacts 
LIMIT 10;

-- 2. TEST GROUP MANAGEMENT

-- Add a new test group
INSERT INTO contact_groups (name, description) 
VALUES ('Test Corporates', 'Test group for corporate clients');

-- View all groups with contact counts
SELECT 'Groups with Contact Counts:' as test_section;
SELECT 
    cg.id,
    cg.name,
    cg.description,
    cg.created_at,
    COUNT(c.id) as contact_count,
    cg.is_active
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.is_active = TRUE
GROUP BY cg.id, cg.name, cg.description, cg.created_at, cg.is_active
ORDER BY cg.name ASC;

-- 3. TEST CONTACT CREATION WITH NEW GROUP

-- Add a test contact with the new group
INSERT INTO contacts (name, email, phone, `group`, group_name, notes, opt1, opt2, opt3)
VALUES ('Test User', 'test@example.com', '123456789', 'Private', 'Test Corporates', 'Test contact for new group', 1, 1, 1);

-- Verify the new contact
SELECT 'New Test Contact:' as test_section;
SELECT id, name, email, `group`, group_name, created_at 
FROM contacts 
WHERE email = 'test@example.com';

-- 4. TEST EMAIL SENDING QUERIES

-- Get all contacts in a specific group (simulates email sending target selection)
SELECT 'Contacts in Test Corporates Group:' as test_section;
SELECT id, name, email, group_name
FROM contacts 
WHERE group_name = 'Test Corporates';

-- Get contacts from multiple groups (simulates multi-group email sending)
SELECT 'Contacts in Companies and Private Groups:' as test_section;
SELECT id, name, email, group_name
FROM contacts 
WHERE group_name IN ('Companies', 'Private')
ORDER BY group_name, name;

-- 5. TEST GROUP OPERATIONS

-- Update a group name (and update all contacts using it)
UPDATE contact_groups SET name = 'Corporate Clients', description = 'Updated corporate clients group' 
WHERE name = 'Test Corporates';

UPDATE contacts SET group_name = 'Corporate Clients' 
WHERE group_name = 'Test Corporates';

-- Verify the update
SELECT 'Updated Group and Contacts:' as test_section;
SELECT cg.name as group_name, COUNT(c.id) as contact_count
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.name = 'Corporate Clients'
GROUP BY cg.name;

-- 6. TEST GROUP DELETION SAFETY

-- Try to check if a group has contacts before deletion
SELECT 'Group Deletion Safety Check:' as test_section;
SELECT 
    cg.name,
    COUNT(c.id) as contact_count,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 'CANNOT DELETE - HAS CONTACTS'
        ELSE 'SAFE TO DELETE'
    END as deletion_status
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.name = 'Corporate Clients'
GROUP BY cg.name;

-- Soft delete a group (only if no contacts)
-- UPDATE contact_groups SET is_active = FALSE WHERE name = 'Corporate Clients' AND id NOT IN (
--     SELECT DISTINCT cg2.id FROM contact_groups cg2 
--     INNER JOIN contacts c ON c.group_name = cg2.name 
--     WHERE cg2.name = 'Corporate Clients'
-- );

-- 7. EMAIL CAMPAIGN SIMULATION

-- Simulate getting recipients for email campaign (like the send-email page does)
SELECT 'Email Campaign Recipients Simulation:' as test_section;

-- Individual contacts
SELECT 'individual' as type, id, name, email, group_name as source
FROM contacts 
WHERE id IN (2, 3, 5);  -- Simulates selectedContacts

UNION ALL

-- Group-based contacts  
SELECT 'group' as type, id, name, email, group_name as source
FROM contacts 
WHERE group_name IN ('Companies', 'Schools');  -- Simulates selectedGroups

-- 8. CLEANUP TEST DATA

-- Remove test contact and group
DELETE FROM contacts WHERE email = 'test@example.com';
DELETE FROM contact_groups WHERE name = 'Corporate Clients';

-- 9. FINAL VERIFICATION

SELECT 'Final State - All Groups:' as test_section;
SELECT 
    cg.name,
    cg.description,
    COUNT(c.id) as contact_count,
    cg.is_active
FROM contact_groups cg
LEFT JOIN contacts c ON c.group_name = cg.name
WHERE cg.is_active = TRUE
GROUP BY cg.id, cg.name, cg.description, cg.is_active
ORDER BY cg.name ASC;