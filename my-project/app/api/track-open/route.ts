import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
});

const gif = Buffer.from(
  'R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const c = searchParams.get('c');
  const e = searchParams.get('e');

  if (c && e) {
    await pool.query(
      'INSERT INTO opens (campaign_id, email) VALUES (?, ?)',
      [c, e]
    );
  }

  return new NextResponse(gif, {
    headers: { 'Content-Type': 'image/gif' },
  });
}
