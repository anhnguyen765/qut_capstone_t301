import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get('days')) || 30;

    // Get counts grouped by date for the last N days
    const rows: any = await executeQuery(
      `SELECT DATE(created_at) as dt, COUNT(*) as cnt FROM contacts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY DATE(created_at)`,
      [daysParam]
    );

    // Build full series (fill missing days with 0)
    const results: { date: string; subscribers: number }[] = [];
    const now = new Date();
    for (let i = daysParam - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = rows.find((r: any) => String(r.dt) === key);
      results.push({ date: key, subscribers: row ? Number(row.cnt) : 0 });
    }

    return NextResponse.json({ series: results });
  } catch (error) {
    console.error('Dashboard subscribers error', error);
    return NextResponse.json({ error: 'Failed to fetch subscriber trend' }, { status: 500 });
  }
}
