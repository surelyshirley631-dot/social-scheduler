import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { encryptToken } from "@/lib/crypto"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const cookieState = req.cookies.get("ig_oauth_state")?.value
  if (error) {
    return new NextResponse(`OAuth error: ${error}`, { status: 400 })
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return new NextResponse("Invalid OAuth state", { status: 400 })
  }
  const tokenRes = await fetch(
    "https://graph.facebook.com/v19.0/oauth/access_token?" +
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID ?? "",
        client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI ?? "",
        code,
      }).toString(),
    { method: "GET" }
  )
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    return new NextResponse(`Token exchange failed: ${text}`, { status: 400 })
  }
  const short = await tokenRes.json()
  const longRes = await fetch(
    "https://graph.facebook.com/v19.0/oauth/access_token?" +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.INSTAGRAM_APP_ID ?? "",
        client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
        fb_exchange_token: short.access_token,
      }).toString(),
    { method: "GET" }
  )
  if (!longRes.ok) {
    const text = await longRes.text()
    return new NextResponse(`Long-lived token failed: ${text}`, { status: 400 })
  }
  const longJson = await longRes.json()
  const longToken = longJson.access_token as string
  const expiresIn = longJson.expires_in as number | undefined
  const pagesRes = await fetch(
    "https://graph.facebook.com/v19.0/me/accounts?" +
      new URLSearchParams({ access_token: longToken }).toString(),
    { method: "GET" }
  )
  if (!pagesRes.ok) {
    const text = await pagesRes.text()
    return new NextResponse(`No pages: ${text}`, { status: 400 })
  }
  const pagesJson = await pagesRes.json()
  const page = pagesJson.data?.[0]
  if (!page?.id) {
    return new NextResponse("No Facebook page found", { status: 400 })
  }
  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?` +
      new URLSearchParams({
        fields: "instagram_business_account{name,username}",
        access_token: longToken,
      }).toString(),
    { method: "GET" }
  )
  if (!igRes.ok) {
    const text = await igRes.text()
    return new NextResponse(`Get IG business account failed: ${text}`, {
      status: 400,
    })
  }
  const igJson = await igRes.json()
  const igAccount = igJson.instagram_business_account
  if (!igAccount?.id) {
    return new NextResponse("No Instagram business account", { status: 400 })
  }
  const encryptedAccessToken = encryptToken(longToken)
  const longExpiresAt =
    expiresIn != null ? new Date(Date.now() + expiresIn * 1000) : null
  const userId = (session.user as any).id as string
  await prisma.account.upsert({
    where: {
      userId_platform_platformAccountId: {
        userId,
        platform: "INSTAGRAM",
        platformAccountId: igAccount.id,
      },
    },
    update: {
      encryptedAccessToken,
      platformAccountUsername: igAccount.username ?? null,
      longLivedTokenExpiresAt: longExpiresAt,
    },
    create: {
      userId,
      platform: "INSTAGRAM",
      platformAccountId: igAccount.id,
      platformAccountUsername: igAccount.username ?? null,
      encryptedAccessToken,
      longLivedTokenExpiresAt: longExpiresAt,
    },
  })
  const res = NextResponse.redirect("/dashboard/accounts")
  res.cookies.delete("ig_oauth_state")
  return res
}
