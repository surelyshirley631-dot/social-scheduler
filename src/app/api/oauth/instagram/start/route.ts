import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET() {
  const state = randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI ?? "",
    scope:
      "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
    state,
  })
  const url = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  const res = NextResponse.redirect(url)
  res.cookies.set("ig_oauth_state", state, { httpOnly: true, sameSite: "lax" })
  return res
}
