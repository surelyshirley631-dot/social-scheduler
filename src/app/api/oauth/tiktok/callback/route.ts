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
  const cookieState = req.cookies.get("tt_oauth_state")?.value
  if (error) {
    return new NextResponse(`OAuth error: ${error}`, { status: 400 })
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return new NextResponse("Invalid OAuth state", { status: 400 })
  }
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.TIKTOK_CLIENT_KEY}:${process.env.TIKTOK_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TIKTOK_REDIRECT_URI ?? "",
    }).toString(),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    return new NextResponse(`Token exchange failed: ${text}`, { status: 400 })
  }
  const tokenJson = await tokenRes.json()
  const accessToken = tokenJson.access_token as string
  const refreshToken = tokenJson.refresh_token as string | undefined
  const expiresIn = tokenJson.expires_in as number | undefined
  const refreshExpiresIn = tokenJson.refresh_expires_in as number | undefined
  const userInfoRes = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
  if (!userInfoRes.ok) {
    const text = await userInfoRes.text()
    return new NextResponse(`Get TikTok user failed: ${text}`, { status: 400 })
  }
  const info = await userInfoRes.json()
  const userData = info.data?.user
  const platformAccountId = userData?.open_id as string | undefined
  const username =
    (userData?.display_name as string | undefined) ??
    (userData?.username as string | undefined) ??
    null
  if (!platformAccountId) {
    return new NextResponse("No TikTok user open_id", { status: 400 })
  }
  const encryptedAccessToken = encryptToken(accessToken)
  const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null
  const accessTokenExpiresAt =
    expiresIn != null ? new Date(Date.now() + expiresIn * 1000) : null
  const refreshTokenExpiresAt =
    refreshExpiresIn != null
      ? new Date(Date.now() + refreshExpiresIn * 1000)
      : null
  const userId = (session.user as any).id as string
  await prisma.account.upsert({
    where: {
      userId_platform_platformAccountId: {
        userId,
        platform: "TIKTOK",
        platformAccountId,
      },
    },
    update: {
      encryptedAccessToken,
      encryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      platformAccountUsername: username,
    },
    create: {
      userId,
      platform: "TIKTOK",
      platformAccountId,
      platformAccountUsername: username,
      encryptedAccessToken,
      encryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    },
  })
  const res = NextResponse.redirect("/dashboard/accounts")
  res.cookies.delete("tt_oauth_state")
  return res
}
