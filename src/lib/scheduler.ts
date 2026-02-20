import cron from "node-cron"
import { prisma } from "@/lib/db"
import { decryptToken, encryptToken } from "@/lib/crypto"
import { publishPost } from "@/lib/publishers"

async function processDuePosts() {
  const now = new Date()
  const posts = await prisma.post.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    select: { id: true },
  })
  for (const p of posts) {
    await publishPost(p.id)
  }
}

async function refreshLongLivedTokens() {
  const now = new Date()
  const threshold = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const igAccounts = await prisma.account.findMany({
    where: {
      platform: "INSTAGRAM",
      longLivedTokenExpiresAt: { not: null, lte: threshold },
    },
  })
  for (const a of igAccounts) {
    try {
      const token = decryptToken(a.encryptedAccessToken)
      const res = await fetch(
        "https://graph.facebook.com/v19.0/oauth/access_token?" +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: process.env.INSTAGRAM_APP_ID ?? "",
            client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
            fb_exchange_token: token,
          }).toString(),
        { method: "GET" }
      )
      if (!res.ok) continue
      const json = await res.json()
      const newToken = json.access_token as string
      const expiresIn = json.expires_in as number | undefined
      const enc = encryptToken(newToken)
      const expiresAt =
        expiresIn != null ? new Date(Date.now() + expiresIn * 1000) : null
      await prisma.account.update({
        where: { id: a.id },
        data: {
          encryptedAccessToken: enc,
          longLivedTokenExpiresAt: expiresAt,
        },
      })
    } catch {}
  }
  const ttAccounts = await prisma.account.findMany({
    where: {
      platform: "TIKTOK",
      refreshTokenExpiresAt: { not: null, lte: threshold },
      encryptedRefreshToken: { not: null },
    },
  })
  for (const a of ttAccounts) {
    try {
      const refreshToken = decryptToken(a.encryptedRefreshToken as string)
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
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
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      })
      if (!res.ok) continue
      const json = await res.json()
      const accessToken = json.access_token as string
      const newRefreshToken = json.refresh_token as string | undefined
      const expiresIn = json.expires_in as number | undefined
      const refreshExpiresIn = json.refresh_expires_in as number | undefined
      const encAccess = encryptToken(accessToken)
      const encRefresh = newRefreshToken
        ? encryptToken(newRefreshToken)
        : a.encryptedRefreshToken
      const accessTokenExpiresAt =
        expiresIn != null ? new Date(Date.now() + expiresIn * 1000) : null
      const refreshTokenExpiresAt =
        refreshExpiresIn != null
          ? new Date(Date.now() + refreshExpiresIn * 1000)
          : a.refreshTokenExpiresAt
      await prisma.account.update({
        where: { id: a.id },
        data: {
          encryptedAccessToken: encAccess,
          encryptedRefreshToken: encRefresh,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
        },
      })
    } catch {}
  }
}

cron.schedule("* * * * *", () => {
  processDuePosts()
})

cron.schedule("0 3 * * *", () => {
  refreshLongLivedTokens()
})
