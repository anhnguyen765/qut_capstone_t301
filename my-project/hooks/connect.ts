import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const contacts = await prisma.contact.findMany();
  return NextResponse.json(contacts);
}