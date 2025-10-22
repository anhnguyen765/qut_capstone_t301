import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check if password_resets table exists
    const tables = await executeQuery(
      "SHOW TABLES LIKE 'password_resets'"
    );
    
    console.log("Tables result:", tables);
    
    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({
        error: "password_resets table does not exist",
        suggestion: "Run the migration SQL to create the table"
      });
    }

    // Check table structure
    const structure = await executeQuery(
      "DESCRIBE password_resets"
    );

    // Count total tokens
    const tokenCount = await executeQuery(
      "SELECT COUNT(*) as count FROM password_resets"
    );

    // Check recent tokens
    const recentTokens = await executeQuery(
      "SELECT id, email, expires_at, used, created_at FROM password_resets ORDER BY created_at DESC LIMIT 5"
    );

    return NextResponse.json({
      message: "Database check completed",
      tableExists: true,
      structure,
      tokenCount,
      recentTokens
    });

  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json({
      error: "Database check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}