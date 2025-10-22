# Admin-Only Password Reset Setup Guide

## 🗄️ Database Migration Required

### Step 1: Execute SQL on Your External Database

Run the following SQL on your external database to create the password reset table:

```sql
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
);
```

### Step 2: Environment Variables

Ensure your `.env.local` file has the following variables set for your external database:

```env
# Database Configuration
DB_HOST=your-external-database-host.com
DB_USER=your-database-username
DB_PASS=your-database-password
DB_NAME=your-database-name

# Email Configuration (Required for password reset emails)
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
SMTP_SECURE=false

# Application URL (for reset links)
NEXTAUTH_URL=http://localhost:3000
# Or your production URL: https://yourdomain.com
```

### Step 3: Verify Database Connection

You can test your database connection by checking the existing users table:

```sql
-- Check if you have admin users
SELECT id, first_name, last_name, email, role FROM users WHERE role = 'admin';

-- If no admin users exist, create one for testing:
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('Admin', 'Test', 'admin@yourdomain.com', '$2a$12$hash_here', 'admin');
```

## 🔧 Features Implemented

### 1. **Admin Detection**
- Login page automatically detects if entered email belongs to an admin
- "Forgot password?" button only appears for admin emails
- Real-time admin status checking

### 2. **Secure Password Reset Flow**
- **Step 1**: Admin enters email on `/forgot-password`
- **Step 2**: System sends secure reset email (if admin email)
- **Step 3**: Admin clicks link to `/reset-password?token=xxx`
- **Step 4**: Admin enters new password with validation
- **Step 5**: Redirect to login with success message

### 3. **Security Features**
- ✅ **Admin-Only Access**: Only users with `role = 'admin'` can reset passwords
- ✅ **Rate Limiting**: Max 3 reset requests per email every 15 minutes
- ✅ **Secure Tokens**: 32-byte cryptographically secure random tokens
- ✅ **Token Expiration**: 1-hour expiry for reset links
- ✅ **Single-Use Tokens**: Tokens are invalidated after successful use
- ✅ **Password Validation**: Strong password requirements
- ✅ **Email Enumeration Protection**: Same response for valid/invalid emails

### 4. **Professional Email Template**
- Branded HTML email with security notices
- Clear expiration warnings
- Admin-specific messaging
- Fallback text version

## 🚀 Testing the Implementation

### 1. **Create Test Admin User**
```sql
-- Replace 'your_hashed_password' with a bcrypt hash of your desired password
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('Test', 'Admin', 'testadmin@yourdomain.com', '$2a$12$your_hashed_password_here', 'admin');
```

### 2. **Test the Flow**
1. Go to `/login`
2. Type in the admin email - "Forgot password?" button should appear
3. Click "Forgot password?" to go to `/forgot-password`
4. Enter admin email and submit
5. Check your email for the reset link
6. Click the reset link to set a new password

### 3. **Verify Non-Admin Behavior**
1. Go to `/login`
2. Type in a non-admin email
3. "Forgot password?" button should NOT appear

## 🔧 Troubleshooting

### Database Issues
- Verify your external database credentials in `.env.local`
- Ensure the `users` table exists with `role` column
- Check that foreign key constraints are satisfied

### Email Issues
- Verify SMTP settings in `.env.local`
- Test email configuration with your hosting provider
- Check spam folders for reset emails

### Admin Detection Issues
- Verify admin users have `role = 'admin'` in the database
- Check browser network tab for API call responses
- Ensure `/api/auth/check-admin` endpoint is accessible

## 📋 Implementation Summary

### New Files Created:
- `app/api/auth/check-admin/route.ts` - Admin email verification
- `app/api/auth/forgot-password/route.ts` - Password reset request
- `app/api/auth/reset-password/route.ts` - Password reset completion
- `app/forgot-password/page.tsx` - Forgot password form
- `app/reset-password/page.tsx` - Reset password form
- `database/password_reset_migration.sql` - Database schema

### Modified Files:
- `app/login/page.tsx` - Added admin detection and conditional forgot password button

The implementation provides enterprise-grade security while maintaining a smooth user experience for admin users only.