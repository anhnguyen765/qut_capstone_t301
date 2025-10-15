import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET() {
  try {
    // last SMTP errors from email_queue or email_logs
    const lastErrorRes: any = await executeQuery(
      `SELECT error_message as error, MAX(updated_at) as at FROM email_queue WHERE error_message IS NOT NULL GROUP BY error_message ORDER BY at DESC LIMIT 1`,
      []
    );

    const lastError = lastErrorRes && lastErrorRes[0] ? { message: lastErrorRes[0].error, at: lastErrorRes[0].at } : null;

    // bounce rate estimate from send_logs
    const totalSentRes: any = await executeQuery(
      `SELECT COUNT(*) as total FROM send_logs WHERE status = 'sent'`,
      []
    );
    const bouncedRes: any = await executeQuery(
      `SELECT COUNT(*) as bounced FROM send_logs WHERE status = 'bounced'`,
      []
    );

    const total = totalSentRes && totalSentRes[0] ? Number(totalSentRes[0].total) : 0;
    const bounced = bouncedRes && bouncedRes[0] ? Number(bouncedRes[0].bounced) : 0;
    const bounceRate = total > 0 ? Math.round((bounced / total) * 100) : 0;

    return NextResponse.json({ lastError, bounceRate });
  } catch (error) {
    console.error('Dashboard smtp error', error);
    return NextResponse.json({ error: 'Failed to fetch smtp health' }, { status: 500 });
  }
}
