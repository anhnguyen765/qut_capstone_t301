# Email Campaign System

A comprehensive email campaign management system built with Next.js, featuring Unlayer email editor integration, queue-based sending, and detailed tracking.

## Features

### 🎨 Email Design
- **Unlayer Editor Integration**: Professional drag-and-drop email designer
- **Design Export**: Save designs as JSON for editing and HTML for sending
- **Template Management**: Create and reuse email templates

### 📧 Campaign Management
- **Campaign Creation**: Design emails with subject lines and sender information
- **Recipient Selection**: Choose contacts from different groups (Companies, Private, Groups, OSHC, Schools)
- **Batch Processing**: Send emails in configurable batches with delays

### 📊 Queue System
- **Email Queue**: Track email sending status (pending, sending, sent, failed, retry)
- **Retry Logic**: Automatic retry for failed emails (configurable attempts)
- **Batch Processing**: Process emails in batches with configurable delays
- **Status Tracking**: Real-time monitoring of queue status

### 📈 Monitoring & Analytics
- **Queue Statistics**: View pending, sending, sent, and failed email counts
- **Success Rate**: Track email delivery success rates
- **Detailed Logs**: Comprehensive logging of all email activities
- **Real-time Updates**: Auto-refresh monitoring dashboard

### 🔧 Technical Features
- **cPanel SMTP Integration**: Uses cPanel SMTP for reliable email delivery
- **Role-based Access**: Admin-only access to campaign management
- **Database Tracking**: Complete audit trail of all email activities
- **Error Handling**: Robust error handling and logging

## System Architecture

### Database Schema

#### Campaigns Table
```sql
- id, title, date, type, status
- subject_line, sender_name, sender_email
- html_content, design (JSON)
- total_recipients, sent_count, failed_count
- scheduled_at, sent_at timestamps
```

#### Email Queue Table
```sql
- campaign_id, contact_id, email
- status (pending, sending, sent, failed, retry)
- attempts, max_attempts, last_attempt_at
- error_message, sent_at
```

#### Email Logs Table
```sql
- campaign_id, queue_id, contact_id
- action (queued, sent, failed, retry)
- smtp_response, error_message
- created_at timestamp
```

### API Endpoints

#### Campaign Management
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new email campaign
- `PUT /api/campaigns` - Send campaign to selected recipients

#### Queue Management
- `GET /api/email-queue` - Get queue statistics
- `POST /api/email-queue` - Trigger queue processing

#### Logging
- `GET /api/campaign-logs` - Get email activity logs with pagination

### Components

#### Email Campaign Builder (`/campaigns/email-builder`)
- Unlayer editor integration
- Campaign settings (title, subject, sender info)
- Design save/load functionality

#### Campaign Sender (`/campaigns/send`)
- Campaign selection
- Recipient filtering and selection
- Batch sending interface

#### Campaign Monitor (`/campaigns/monitor`)
- Real-time queue statistics
- Success rate tracking
- Recent activity logs
- Manual queue processing

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local`:

```env
# SMTP Configuration (cPanel)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
```

### 2. Database Setup
Run the updated schema to create the new tables:

```bash
mysql -u your_user -p your_database < database/schema.sql
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Usage Workflow

### 1. Create Email Campaign
1. Navigate to `/campaigns/email-builder`
2. Fill in campaign details (title, subject, sender info)
3. Design email using Unlayer editor
4. Save design and campaign

### 2. Send Campaign
1. Navigate to `/campaigns/send`
2. Select the created campaign
3. Choose recipients (filter by group if needed)
4. Click "Send" to queue emails

### 3. Monitor Progress
1. Navigate to `/campaigns/monitor`
2. View queue statistics and success rates
3. Monitor recent email activity
4. Manually trigger queue processing if needed

## Configuration

### Queue Settings
Modify `app/lib/emailQueue.ts` to adjust:
- `batchSize`: Number of emails per batch (default: 10)
- `batchDelay`: Delay between batches in ms (default: 2000)
- `retryDelay`: Delay before retrying failed emails (default: 5000)
- `maxAttempts`: Maximum retry attempts (default: 3)

### SMTP Settings
Update `app/lib/email.ts` to configure:
- SMTP host, port, and security settings
- Authentication credentials
- Connection verification

## Security Features

- **Role-based Access**: Only admin users can access campaign management
- **Input Validation**: All inputs are validated and sanitized
- **Error Logging**: Comprehensive error tracking without exposing sensitive data
- **Rate Limiting**: Built-in delays prevent SMTP server overload

## Monitoring & Maintenance

### Queue Health
- Monitor queue statistics regularly
- Check for stuck emails in "sending" status
- Review failed email logs for patterns

### SMTP Health
- Test SMTP connection regularly
- Monitor delivery rates
- Check for authentication issues

### Database Maintenance
- Regularly clean old logs (older than 90 days)
- Monitor queue table size
- Archive completed campaigns

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify SMTP credentials
   - Check firewall settings
   - Ensure correct port configuration

2. **Emails Stuck in Queue**
   - Check SMTP server status
   - Verify email content validity
   - Review error logs

3. **Low Delivery Rate**
   - Check sender reputation
   - Verify email content
   - Review recipient email validity

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG_EMAIL=true
```

This will log all SMTP interactions and queue processing details.

## Support

For issues or questions:
1. Check the logs in `/campaigns/monitor`
2. Review SMTP configuration
3. Verify database connectivity
4. Check environment variables
