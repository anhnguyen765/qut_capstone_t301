import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const e = searchParams.get('e');

  if (!e) {
    return NextResponse.json({ error: 'Missing email token' }, { status: 400 });
  }

  const email = Buffer.from(e, 'base64').toString('utf-8');

  await pool.query('UPDATE contacts SET `group`="Private" WHERE email=?', [email]);
  await pool.query('UPDATE contacts SET notes=CONCAT(IFNULL(notes,""), "\nUnsubscribed at ", NOW()) WHERE email=?', [email]);

  return new NextResponse(`<p>${email} has been unsubscribed.</p>`, {
    headers: { 'Content-Type': 'text/html' },
  });
}
