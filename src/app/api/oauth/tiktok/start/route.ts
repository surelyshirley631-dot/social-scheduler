import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET() {
  const state = randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI ?? "",
    scope: "user.info.basic,video.publish",
    response_type: "code",
    state,
  })
  const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  const res = NextResponse.redirect(url)
  res.cookies.set("tt_oauth_state", state, { httpOnly: true, sameSite: "lax" })
  return res
}

