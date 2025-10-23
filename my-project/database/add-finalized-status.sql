-- Add 'finalized' to campaigns status ENUM
-- This migration adds the 'finalized' status to the campaigns table

ALTER TABLE campaigns 
MODIFY COLUMN status ENUM('draft', 'scheduled', 'finalized', 'sent', 'archived') DEFAULT 'draft';