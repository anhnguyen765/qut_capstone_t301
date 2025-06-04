import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute("SELECT name, email, `group` FROM contacts");
  await connection.end();

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { name, email, group } = await request.json();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  await connection.execute(
    "INSERT INTO contacts (name, email, `group`) VALUES (?, ?, ?)",
    [name, email, group]
  );
  await connection.end();

  return NextResponse.json({ success: true });
}