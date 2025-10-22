-- Test script for admin password reset setup
-- Execute these queries on your external database

-- 1. Check if password_resets table was created successfully
DESCRIBE password_resets;

-- 2. Check existing admin users
SELECT id, first_name, last_name, email, role, created_at 
FROM users 
WHERE role = 'admin';

-- 3. If no admin users exist, create a test admin (replace with your desired credentials)
-- Note: You'll need to hash the password using bcrypt before inserting
-- This is just an example - use your actual hashed password
/*
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('Test', 'Admin', 'admin@test.com', '$2a$12$your_bcrypt_hashed_password_here', 'admin');
*/

-- 4. Verify the foreign key relationship works
SELECT u.id, u.email, u.role, 
       COUNT(pr.id) as reset_requests
FROM users u 
LEFT JOIN password_resets pr ON u.id = pr.user_id 
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.role;

-- 5. Check table indexes
SHOW INDEX FROM password_resets;

-- 6. Test cleanup query (for old/expired tokens)
SELECT COUNT(*) as expired_tokens 
FROM password_resets 
WHERE expires_at < NOW() OR used = TRUE;