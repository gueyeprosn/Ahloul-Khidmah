import { NextResponse } from "next/server"
import { isWhatsAppCloudConfigured } from "@/lib/whatsapp"

export async function GET() {
  return NextResponse.json({
    cloud: isWhatsAppCloudConfigured(),
  })
}
