# Templates Fetch Error Fix

## Problem
The campaigns page was showing "failed to fetch templates error" because:
1. The `/api/templates` route was empty
2. The `templatesList` state variable was referenced but not defined
3. Templates were not being fetched from the backend

## Solution
Implemented the complete templates API and added proper state management for templates on the campaigns page.

## Changes Made

### 1. Templates API Route (`app/api/templates/route.ts`)

**Created complete CRUD API:**
```typescript
// GET: List all templates
export async function GET() {
  try {
    const templates = await executeQuery(
      "SELECT * FROM templates ORDER BY updated_at DESC"
    );
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST: Create a new template
export async function POST(request: NextRequest) {
  // Implementation for creating templates
}

// PUT: Update a template
export async function PUT(request: NextRequest) {
  // Implementation for updating templates
}

// DELETE: Delete a template
export async function DELETE(request: NextRequest) {
  // Implementation for deleting templates
}
```

### 2. Campaigns Page State (`app/campaigns/page.tsx`)

**Added templates state:**
```typescript
const [templatesList, setTemplatesList] = useState<any[]>([]);
```

**Added templates fetching in useEffect:**
```typescript
useEffect(() => {
  setMounted(true);
  
  // Fetch campaigns from backend
  fetch("/api/campaigns")
    .then((res) => res.json())
    .then((data) => {
      // ... existing campaign fetching logic
    })
    .catch((err) => console.error("Failed to fetch campaigns:", err));

  // Fetch templates from backend
  fetch("/api/templates")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.templates)) {
        setTemplatesList(data.templates);
      }
    })
    .catch((err) => console.error("Failed to fetch templates:", err));
}, []);
```

**Updated template field reference:**
```typescript
// Changed from template.content to template.design
setEmailDesign(template.design ? JSON.parse(template.design) : null);
```

## Database Schema

The templates table structure:
```sql
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    design TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /api/templates
- **Purpose**: Fetch all templates
- **Response**: `{ templates: Template[] }`
- **Error**: `{ error: string }`

### POST /api/templates
- **Purpose**: Create a new template
- **Body**: `{ name: string, subject: string, design: object }`
- **Response**: `{ success: boolean, templateId: number }`

### PUT /api/templates
- **Purpose**: Update an existing template
- **Body**: `{ id: number, name: string, subject: string, design: object }`
- **Response**: `{ success: boolean }`

### DELETE /api/templates
- **Purpose**: Delete a template
- **Body**: `{ id: number }`
- **Response**: `{ success: boolean }`

## Template Object Structure

```typescript
type Template = {
  id: string;
  name: string;
  subject: string;
  design: string; // JSON string of design data
  created_at: string;
  updated_at: string;
};
```

## Usage in Campaigns Page

### Template Selection
```tsx
<select
  value={newCampaignData.templateId || ''}
  onChange={async e => {
    const templateId = e.target.value;
    if (!templateId) {
      setNewCampaignData(d => ({ ...d, templateId: '', title: '', }));
      setEmailDesign(null);
      return;
    }
    const template = templatesList.find((t: any) => String(t.id) === String(templateId));
    if (template) {
      setNewCampaignData(d => ({
        ...d,
        templateId,
        title: template.name || '',
      }));
      setEmailDesign(template.design ? JSON.parse(template.design) : null);
    }
  }}
>
  <option value="">No template</option>
  {templatesList.map((t: any) => (
    <option key={t.id} value={t.id}>{t.name}</option>
  ))}
</select>
```

## Error Handling

### Frontend Error Handling
- Added `.catch()` blocks for both campaigns and templates fetching
- Console error logging for debugging
- Graceful fallback when templates fail to load

### Backend Error Handling
- Try-catch blocks around database operations
- Proper HTTP status codes (400, 500)
- Detailed error messages for debugging

## Benefits

1. **Fixed Templates Fetching**: Templates now load properly from the database
2. **Complete CRUD API**: Full template management functionality
3. **Proper State Management**: Templates state is properly initialized and updated
4. **Error Handling**: Robust error handling for both frontend and backend
5. **Database Integration**: Proper integration with the templates table

## Testing

### Manual Testing
1. **Load Campaigns Page**: Verify templates dropdown is populated
2. **Select Template**: Test template selection and design loading
3. **Create Template**: Test template creation from campaigns
4. **Error Scenarios**: Test with database connection issues

### API Testing
1. **GET /api/templates**: Verify template list returns
2. **POST /api/templates**: Test template creation
3. **PUT /api/templates**: Test template updates
4. **DELETE /api/templates**: Test template deletion

## Files Modified

### API Routes
- `app/api/templates/route.ts` - Created complete CRUD API

### Frontend Components
- `app/campaigns/page.tsx` - Added templates state and fetching

## Future Enhancements

1. **Template Categories**: Add categories to organize templates
2. **Template Preview**: Show template preview in dropdown
3. **Template Search**: Add search functionality for templates
4. **Template Validation**: Add validation for template design data
5. **Template Sharing**: Add template sharing between users
