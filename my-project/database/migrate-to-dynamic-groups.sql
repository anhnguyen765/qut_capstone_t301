-- Migration to Dynamic Contact Groups
-- This script migrates from ENUM-based groups to dynamic groups

-- Step 1: Create contact_groups table
CREATE TABLE contact_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Step 2: Insert existing groups as default groups
INSERT INTO contact_groups (name, description) VALUES
('Companies', 'Business and corporate contacts'),
('Groups', 'Group bookings and organizations'),
('Private', 'Individual private customers'),
('OSHC', 'Overseas Student Health Cover contacts'),
('Schools', 'Educational institutions and school groups');

-- Step 3: Change contacts table group field from ENUM to VARCHAR
-- First, add the new column
ALTER TABLE contacts ADD COLUMN group_name VARCHAR(50);

-- Step 4: Copy existing group values to new column
UPDATE contacts SET group_name = `group`;

-- Step 5: Add foreign key constraint (optional - for data integrity)
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_group 
    FOREIGN KEY (group_name) REFERENCES contact_groups(name) 
    ON UPDATE CASCADE ON DELETE SET NULL;

-- Step 6: Drop the old ENUM column (CAREFUL - this is irreversible!)
-- Uncomment the next line only after testing the migration thoroughly
-- ALTER TABLE contacts DROP COLUMN `group`;

-- Step 7: Rename the new column to match existing code
-- Uncomment the next line only after dropping the old column
-- ALTER TABLE contacts CHANGE group_name `group` VARCHAR(50);

-- For now, we'll keep both columns during testing phase
-- Remove this comment and execute steps 6-7 after confirming everything works

-- Create index for performance
CREATE INDEX idx_contacts_group_name ON contacts(group_name);
CREATE INDEX idx_contact_groups_active ON contact_groups(is_active);