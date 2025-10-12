CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type ENUM('app', 'classes', 'fishing_comps', 'oshc_vacation_care', 'promotion', 'other', 'email', 'template') NOT NULL,
    status ENUM('draft', 'scheduled', 'sent', 'archived') DEFAULT 'draft',
    target_groups TEXT,
    content MEDIUMTEXT,
    design LONGTEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
 
-- Create email_queue table for tracking email sending
CREATE TABLE IF NOT EXISTS email_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    contact_id INT NULL,
    email VARCHAR(100) NOT NULL,
    status ENUM('pending', 'sending', 'sent', 'failed', 'retry') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    last_attempt_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_pending (status, attempts, max_attempts)
);

-- Create email_logs table for detailed sending logs
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    queue_id INT NOT NULL,
    contact_id INT NULL,
    email VARCHAR(100) NOT NULL,
    action ENUM('queued', 'sent', 'failed', 'retry') NOT NULL,
    smtp_response TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (queue_id) REFERENCES email_queue(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_queue_id (queue_id),
    INDEX idx_created_at (created_at)
);

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS crm_db;
USE crm_db;
-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
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

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    `group` ENUM('Companies', 'Groups', 'Private', 'OSHC', 'Schools') DEFAULT 'Private',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_name (name),
    INDEX idx_group (`group`),
    INDEX idx_created_at (created_at),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Send logs (per recipient)
CREATE TABLE IF NOT EXISTS send_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    contact_id INT,
    email VARCHAR(255),
    status ENUM('queued','sent','failed','bounced') DEFAULT 'queued',
    error TEXT,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    INDEX idx_campaign (campaign_id),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Track opens
CREATE TABLE IF NOT EXISTS opens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT,
    contact_id INT NULL,
    email VARCHAR(255),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- Create email_schedule table for scheduled emails
CREATE TABLE IF NOT EXISTS email_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status ENUM('scheduled', 'sent', 'cancelled') DEFAULT 'scheduled',
    recipient_type ENUM('all', 'group', 'individual') DEFAULT 'all',
    recipient_email VARCHAR(100),
    recipient_group VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_status (status),
    INDEX idx_campaign_id (campaign_id)
);

-- Create email_sends table for tracking email send operations
CREATE TABLE IF NOT EXISTS email_sends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    total_recipients INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    pending_count INT NOT NULL DEFAULT 0,
    status ENUM('queued', 'sending', 'completed', 'failed') DEFAULT 'queued',
    send_type ENUM('immediate', 'scheduled') DEFAULT 'immediate',
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Note: Newsletters and templates are now stored in the campaigns table with type='email' and type='template' respectively

-- Insert a default admin user (password: admin123)
INSERT INTO users (first_name, last_name, email, password, role) 
VALUES ('Admin', 'User', 'admin@example.com', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE id=id; 