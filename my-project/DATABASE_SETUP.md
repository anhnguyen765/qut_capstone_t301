# Database Setup Guide

## Prerequisites

1. MySQL server installed and running
2. Node.js and npm installed
3. Access to MySQL command line or a GUI tool like MySQL Workbench

## Database Configuration

### 1. Create Database and Tables

Run the SQL commands from `database/schema.sql` in your MySQL server:

```sql
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS crm_db;
USE crm_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Create sessions table for JWT token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);
```

### 2. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=crm_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 3. Install Dependencies

Make sure all required dependencies are installed:

```bash
npm install bcryptjs jsonwebtoken mysql2
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

## API Endpoints

### Authentication Endpoints

1. **POST /api/auth/register** - User registration
   - Body: `{ firstName, lastName, email, password }`
   - Returns: `{ message, user }`

2. **POST /api/auth/login** - User login
   - Body: `{ email, password }`
   - Returns: `{ message, user, token }`

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/register` to create a new account

3. Navigate to `http://localhost:3000/login` to sign in

## Security Notes

1. **JWT Secret**: Change the JWT_SECRET in production to a strong, unique key
2. **Database Password**: Use a strong password for your database
3. **HTTPS**: Use HTTPS in production
4. **Password Hashing**: Passwords are automatically hashed using bcrypt
5. **Token Storage**: Consider using HTTP-only cookies for token storage in production

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if MySQL server is running
   - Verify database credentials in `.env.local`
   - Ensure database and tables exist

2. **JWT Token Issues**
   - Verify JWT_SECRET is set in environment variables
   - Check token expiration settings

3. **CORS Issues**
   - Ensure API routes are properly configured
   - Check middleware configuration

### Testing

You can test the API endpoints using tools like:
- Postman
- curl
- Thunder Client (VS Code extension)

Example curl commands:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'
``` 