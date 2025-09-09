#!/bin/bash

# Database Setup Script for Email Campaign System
# This script will help you set up the database for the email campaign system

echo "🚀 Email Campaign System - Database Setup"
echo "=========================================="

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Get database credentials
echo ""
echo "📝 Please enter your database credentials:"
read -p "Database Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Username: " DB_USER
if [ -z "$DB_USER" ]; then
    echo "❌ Database username is required"
    exit 1
fi

read -s -p "Database Password: " DB_PASS
echo ""

read -p "Database Name (default: crm_db): " DB_NAME
DB_NAME=${DB_NAME:-crm_db}

# Test database connection
echo ""
echo "🔍 Testing database connection..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed. Please check your credentials."
    exit 1
fi

# Create database
echo ""
echo "🗄️ Creating database '$DB_NAME'..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# Check if schema file exists
SCHEMA_FILE="database/schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found at $SCHEMA_FILE"
    exit 1
fi

# Import schema
echo ""
echo "📋 Importing database schema..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SCHEMA_FILE"; then
    echo "✅ Schema imported successfully!"
else
    echo "❌ Schema import failed"
    exit 1
fi

# Verify tables
echo ""
echo "🔍 Verifying tables..."
TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" -s)
REQUIRED_TABLES=("users" "campaigns" "email_queue" "email_logs" "contacts")

for table in "${REQUIRED_TABLES[@]}"; do
    if echo "$TABLES" | grep -q "$table"; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' missing"
    fi
done

# Create .env.local file
echo ""
echo "📝 Creating .env.local file..."
ENV_FILE=".env.local"
cat > "$ENV_FILE" << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME

# SMTP Configuration (Update these with your actual SMTP settings)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
EOF

echo "✅ .env.local file created!"

# Final instructions
echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update SMTP settings in .env.local file"
echo "2. Install dependencies: npm install"
echo "3. Start development server: npm run dev"
echo "4. Login with: admin@example.com / admin123"
echo ""
echo "🔗 Useful URLs:"
echo "- Email Builder: http://localhost:3000/campaigns/email-builder"
echo "- Send Campaign: http://localhost:3000/campaigns/send"
echo "- Monitor: http://localhost:3000/campaigns/monitor"
echo ""
echo "📚 For more information, see DATABASE_SETUP_GUIDE.md"

