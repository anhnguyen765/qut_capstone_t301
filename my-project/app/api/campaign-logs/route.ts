import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Get campaign logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT el.*, c.name as contact_name, c.email as contact_email
      FROM email_logs el
      JOIN contacts c ON el.contact_id = c.id
    `;
    
    const params: any[] = [];

    if (campaignId) {
      query += " WHERE el.campaign_id = ?";
      params.push(campaignId);
    }

    query += " ORDER BY el.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const logs = await executeQuery(query, params);
    
    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM email_logs";
    if (campaignId) {
      countQuery += " WHERE campaign_id = ?";
    }
    const countResult = await executeQuery(countQuery, campaignId ? [campaignId] : []);
    const total = countResult[0].total;

    return NextResponse.json({ 
      logs, 
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error("Get campaign logs error:", error);
    return NextResponse.json({ error: "Failed to get campaign logs" }, { status: 500 });
  }
}
