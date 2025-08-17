import { NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

export async function GET() {
  try {
    console.log("Testing database connection...");
    console.log("Environment variables:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      // Don't log password for security
    });

    // Test basic connection
    const result = await executeQuery("SELECT 1 as test");
    console.log("Basic connection test:", result);

    // Check if users table exists
    const tableCheck = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'users'
    `);
    
    console.log("Users table check:", tableCheck);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tableExists: Array.isArray(tableCheck) && tableCheck[0]?.count > 0,
      environment: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        // Don't include password in response
      }
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      environment: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        // Don't include password in response
      }
    }, { status: 500 });
  }
} 