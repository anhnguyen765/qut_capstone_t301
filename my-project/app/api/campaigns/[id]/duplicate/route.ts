import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

// Duplicate a campaign
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title } = body;

    // Get the original campaign data
    const campaignResult = await executeQuery(
      `SELECT * FROM campaigns WHERE id = ?`,
      [id]
    );

    if (!campaignResult || !Array.isArray(campaignResult) || campaignResult.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const originalCampaign = campaignResult[0] as any;

    // Create duplicate campaign
    const duplicateResult = await executeQuery(
      `INSERT INTO campaigns (title, date, type, status, target_groups, content, design, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || `${originalCampaign.title} (Copy)`,
        new Date().toISOString().split('T')[0], // Use current date
        originalCampaign.type,
        'draft', // Always set duplicated campaigns to draft
        originalCampaign.target_groups,
        originalCampaign.content,
        originalCampaign.design,
        originalCampaign.created_by
      ]
    );

    const duplicateId = (duplicateResult as any)?.insertId;

    return NextResponse.json({
      success: true,
      message: "Campaign duplicated successfully",
      campaignId: duplicateId
    });

  } catch (error) {
    console.error("Duplicate campaign error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate campaign" },
      { status: 500 }
    );
  }
}
