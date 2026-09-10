import { NextResponse } from "next/server"
import { MEMBER_COOKIE, memberCookieOptions } from "@/lib/member-auth"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBER_COOKIE, "", { ...memberCookieOptions(0), maxAge: 0 })
  return res
}
