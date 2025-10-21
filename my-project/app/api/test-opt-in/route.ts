import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'timtran115@gmail.com';

    // Check contact's opt-in status
    const contacts = await executeQuery(
      `SELECT id, email, name, opt1, opt2, opt3, \`group\` FROM contacts WHERE email = ?`,
      [email]
    );

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ 
        error: "Contact not found",
        email: email
      }, { status: 404 });
    }

    const contact = contacts[0] as any;

    // Also check recent email queue entries for this contact
    const queueEntries = await executeQuery(
      `SELECT * FROM email_queue WHERE email = ? ORDER BY created_at DESC LIMIT 5`,
      [email]
    );

    return NextResponse.json({
      contact: {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        group: contact.group,
        opt1: !!contact.opt1,  // Convert to boolean
        opt2: !!contact.opt2,
        opt3: !!contact.opt3
      },
      recentQueueEntries: queueEntries,
      validation: {
        canReceiveCampaigns: !!contact.opt1,
        canReceiveNewsletters: !!contact.opt2,
        hasAnyOptIn: !!(contact.opt1 || contact.opt2 || contact.opt3)
      }
    });

  } catch (error) {
    console.error("Test opt-in error:", error);
    return NextResponse.json(
      { error: "Failed to check opt-in status", details: error },
      { status: 500 }
    );
  }
}