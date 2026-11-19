import { NextResponse } from "next/server"
import { getActiveMobileConfig } from "@/lib/mobile/config"

/** Configuration distante — publique, petite, cacheable (ETag = version). */
export async function GET(request: Request) {
  const { version, payload } = await getActiveMobileConfig()
  const etag = `"cfg-${version}"`
  const headers = {
    ETag: etag,
    "Cache-Control": "public, max-age=60, must-revalidate",
  }
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers })
  }
  return NextResponse.json(
    { configVersion: version, ...payload, serverTime: new Date().toISOString() },
    { headers }
  )
}
