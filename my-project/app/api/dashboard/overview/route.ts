import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET() {
  try {
  // total subscribers
  const totalRes: any = await executeQuery("SELECT COUNT(*) as total FROM contacts", []);
  const totalSubscribers = totalRes && totalRes[0] ? totalRes[0].total : 0;

  // active subscribers: schema doesn't include is_active on contacts; fallback to total
  const activeSubscribers = totalSubscribers;

    // pending scheduled sends
    const pendingRes: any = await executeQuery("SELECT COUNT(*) as pending FROM email_schedule WHERE status = 'scheduled'", []);
    const pendingSends = pendingRes && pendingRes[0] ? pendingRes[0].pending : 0;

    // last campaign stats (open rate, ctr)
    const lastCampaignRes: any = await executeQuery("SELECT id FROM campaigns ORDER BY date DESC LIMIT 1", []);
  let lastCampaignOpenRate = 0;
  let lastCampaignCTR = 0;
  let lastCampaignInfo: { id: number; title: string | null; sent: number; opened: number } | null = null;
    if (lastCampaignRes && lastCampaignRes[0]) {
      const campaignId = lastCampaignRes[0].id;
      const campaignTitle = lastCampaignRes[0].title || lastCampaignRes[0].name || null;
      // sent count from send_logs
      const sentRes: any = await executeQuery(
        "SELECT COUNT(*) as sent FROM send_logs WHERE campaign_id = ? AND status = 'sent'",
        [campaignId]
      );
      const sent = sentRes && sentRes[0] ? Number(sentRes[0].sent) : 0;

      // opened count from opens table
      const openedRes: any = await executeQuery(
        "SELECT COUNT(DISTINCT contact_id) as opened FROM opens WHERE campaign_id = ?",
        [campaignId]
      );
      const opened = openedRes && openedRes[0] ? Number(openedRes[0].opened) : 0;

      lastCampaignOpenRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
      lastCampaignCTR = 0; // clicks not tracked in schema

      lastCampaignInfo = {
        id: campaignId,
        title: campaignTitle,
        sent,
        opened,
      };
    }

    return NextResponse.json({
      totalSubscribers,
      activeSubscribers,
      pendingSends,
      lastCampaignOpenRate,
      lastCampaignCTR,
      lastCampaign: lastCampaignInfo || null,
    });
  } catch (error) {
    console.error('Dashboard overview error', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard overview' }, { status: 500 });
  }
}
