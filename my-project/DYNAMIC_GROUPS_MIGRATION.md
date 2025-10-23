# Dynamic Contact Groups Migration Guide

## Overview
This guide will help you migrate from hardcoded ENUM-based contact groups to a dynamic group management system.

## Benefits
✅ **Email Sending Compatibility**: Groups work seamlessly with existing email campaign sending
✅ **Dynamic Management**: Add, edit, delete groups through the UI
✅ **Backward Compatibility**: Existing contacts and campaigns continue to work
✅ **Data Safety**: Gradual migration with fallback to original groups

## Step-by-Step Migration

### Phase 1: Database Setup (Safe)
1. **Run the migration script** (creates new tables alongside existing ones):
   ```sql
   -- Execute: database/migrate-to-dynamic-groups.sql
   ```
   - Creates `contact_groups` table
   - Adds `group_name` column to contacts (keeps existing `group` column)
   - Inserts existing groups as default groups

### Phase 2: API Integration (No Breaking Changes)
1. **Contact Groups APIs** are ready:
   - `GET /api/contact-groups` - List all groups
   - `POST /api/contact-groups` - Create new group
   - `PUT /api/contact-groups/[id]` - Update group
   - `DELETE /api/contact-groups/[id]` - Delete group (with safety checks)

### Phase 3: Frontend Integration

#### Option A: Add Group Management Page
```tsx
// Add to your admin section or contacts page
import GroupManager from "@/app/components/GroupManager";

// In your component:
<GroupManager onGroupsChange={() => {
  // Refresh any dependent data
  fetchContacts();
}} />
```

#### Option B: Update Existing Contacts Page
Replace hardcoded GROUPS array with dynamic loading:

```tsx
// Before (in contacts/page.tsx):
const GROUPS = [
  { label: "Companies", value: "Companies" },
  // ... hardcoded groups
];

// After:
import { useContactGroups } from "@/hooks/useContactGroups";

const { groups, loading } = useContactGroups();
const GROUPS = groups.map(g => ({ label: g.name, value: g.name }));
```

#### Option C: Update Send Email Page
Replace hardcoded groups array:

```tsx
// In send-email/page.tsx, replace:
const groups = ["all", "Companies", "Groups", "Private", "OSHC", "Schools"];

// With:
import { useContactGroupNames } from "@/hooks/useContactGroups";
const groupNames = useContactGroupNames();
const groups = ["all", ...groupNames];
```

### Phase 4: Database Column Switch (When Ready)
After testing thoroughly:

1. **Switch to new column**:
   ```sql
   -- Drop old ENUM column
   ALTER TABLE contacts DROP COLUMN `group`;
   
   -- Rename new column
   ALTER TABLE contacts CHANGE group_name `group` VARCHAR(50);
   ```

2. **Update API queries** to use the new structure (they're already compatible)

## Compatibility Matrix

| Component | Before Migration | After Migration | Notes |
|-----------|------------------|-----------------|-------|
| Contact Management | ✅ Works | ✅ Works | Uses dynamic groups |
| Email Sending | ✅ Works | ✅ Works | targetGroups uses same group names |
| Campaign Creation | ✅ Works | ✅ Works | Group selection from dynamic list |
| Contact Import/Export | ✅ Works | ✅ Works | Group validation against dynamic list |

## Key Features

### 1. **Group Management UI**
- Add/Edit/Delete contact groups
- View contact count per group
- Prevent deletion of groups with contacts
- Real-time validation

### 2. **Email System Integration**
- Groups work with `targetGroups` parameter
- Backward compatibility with existing campaigns
- No changes needed to email sending logic

### 3. **Safety Features**
- Cannot delete groups with contacts
- Name validation (alphanumeric, spaces, hyphens, underscores)
- Duplicate name prevention
- Soft delete (sets is_active = FALSE)

### 4. **Performance Optimizations**
- Cached group loading with useContactGroups hook
- Efficient queries with JOIN for contact counts
- Indexes on frequently queried columns

## Testing Plan

### 1. **Database Migration Test**
```sql
-- Test the migration script on a copy of your database first
-- Verify all existing data is preserved
-- Check that new columns contain expected values
```

### 2. **API Testing**
```bash
# Test group creation
curl -X POST /api/contact-groups \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Group", "description": "Test description"}'

# Test group listing
curl /api/contact-groups

# Test group update
curl -X PUT /api/contact-groups/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "description": "Updated description"}'
```

### 3. **Email Sending Test**
- Create a test campaign
- Select both old and new groups
- Verify emails are sent to correct recipients
- Check that group-based filtering works

## Rollback Plan
If issues arise:

1. **Keep original ENUM column** until fully tested
2. **Use database/add-email-unique-constraint.sql** to restore original state
3. **Frontend can fall back** to hardcoded groups if API fails (built into useContactGroups hook)

## Monitoring
After deployment, monitor:
- Group creation/modification activity
- Email sending success rates
- Contact import success with new groups
- Database performance (new indexes should help)

## Future Enhancements
Once stable, consider:
- Group descriptions in email campaign UI
- Group-specific templates
- Contact bulk operations by group
- Group analytics and reporting