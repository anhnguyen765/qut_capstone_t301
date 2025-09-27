import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

const {
    DB_HOST,
    DB_USER,
    DB_PASS,
    DB_NAME,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    APP_BASE_URL
} = process.env;

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
});

type Contact = {
    id: number;
    name: string;
    email: string;
    group: string;
}

type Campaign = {
    id: number;
    subject: string;
    from_name: string;
    from_email: string;
    html: string;
    json: string;
    status: string;
    batch_size: number;
}

function chunkArray(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function POST(request: NextRequest) {
    try {
        const { campaignId } = await request.json();

        if (!campaignId) {
            return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
        }

        // Load campaign details
        const [campaignRows] = await pool.query(
            "SELECT * FROM campaigns WHERE id = ?",
            [campaignId]
        ) as [Campaign[], any];

        if (campaignRows.length === 0) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        const campaign = campaignRows[0];

        // Get recipients
        const [contacts] = await pool.query(
            'SELECT id, email, name FROM contacts WHERE email IS NOT NULL AND email != ""'
        ) as [Contact[], any];
        if (contacts.length === 0) {
            return NextResponse.json({ error: "No recipients found" }, { status: 404 });
        }

        // Insert send logs
        await Promise.all(
            contacts.map((c) => {
                pool.query(
                    'INSERT INTO send_logs (campaign_id, contact_id, email, status) VALUES (?, ?, ?, ?)',
                    [campaignId, c.id, c.email, 'queued']
                )
            })
        );

        // Setup Nodemailer (cPanel SMTP)
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: true,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            },
            authMethod: "LOGIN",
            debug: true,
            logger: true,
            tls: {
                rejectUnauthorized: false,
                debug: true
            }
        });

        try {
            await transporter.verify();
        } catch (err: any) {
            console.error("SMTP verification failed:", err);
            return NextResponse.json({ error: "SMTP verification failed" }, { status: 500 });
        }

        // Chunk recipients into batches
        const batches = chunkArray(contacts, campaign.batch_size || 50);
        const delayMs = 2000;

        const sendSingle = async (recipient: Contact) => {
            const unsubscribeToken = Buffer.from(`${recipient.email}:${recipient.id}`).toString('base64');
            const unsubscribeUrl = `${APP_BASE_URL}/api/unsubscribe?e=${encodeURIComponent(unsubscribeToken)}&c=${campaignId}`;
            const trackingUrl = `${APP_BASE_URL}/api/track-open?c=${campaignId}&e=${encodeURIComponent(recipient.email)}`;

            const htmlWithFooter = `
            ${campaign.html}
            <div style="font-size:12px;color:#666;margin-top:20px;">
            <p>If you no longer want emails, <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
            </div>
            <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />
        `;

            try {
                const info = await transporter.sendMail({
                    from: `${campaign.from_name || 'CRM System'} <campaigns@2bentrods.com.au>`,
                    to: recipient.email,
                    subject: campaign.subject,
                    html: htmlWithFooter,
                    headers: {
                        'List-Unsubscribe': `<${unsubscribeUrl}>`
                    }
                });

                await pool.query(
                    'UPDATE send_logs SET status=?, sent_at=? WHERE campaign_id=? AND email=?',
                    ['sent', new Date(), campaignId, recipient.email]
                );
            } catch (err: any) {
                await pool.query(
                    'UPDATE send_logs SET status=?, error=? WHERE campaign_id=? AND email=?',
                    ['failed', err.message, campaignId, recipient.email]
                );
                console.error("Error sending email:", err);
            }
        };

        // Async fire off sending
        (async () => {
            await pool.query('UPDATE campaigns SET status=? WHERE id=?', ['sending', campaignId]);

            for (let i = 0; i < batches.length; i++) {
                await Promise.all(batches[i].map((c) => sendSingle(c)));
                if (i < batches.length - 1) {
                    await new Promise((r) => setTimeout(r, delayMs));
                }
            }

            await pool.query('UPDATE campaigns SET status=? WHERE id=?', ['sent', campaignId]);
        })();

        return NextResponse.json({
            ok: true,
            queued: contacts.length,
            batches: batches.length,
        });
    }
}

