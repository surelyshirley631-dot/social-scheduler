import { prisma } from "@/lib/db"
import { decryptToken } from "@/lib/crypto"

export async function publishPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { account: true },
  })
  if (!post) return
  if (post.status !== "PENDING") return
  try {
    if (post.platform === "INSTAGRAM") {
      await publishToInstagram(postId)
    } else if (post.platform === "TIKTOK") {
      await publishToTikTok(postId)
    }
  } catch (e: any) {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "FAILED", errorMessage: String(e) },
    })
  }
}

async function publishToInstagram(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { account: true },
  })
  if (!post) return
  const token = decryptToken(post.account.encryptedAccessToken)
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${post.account.platformAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: post.mediaUrl,
        caption: post.caption ?? "",
        access_token: token,
      }),
    }
  )
  if (!containerRes.ok) {
    const t = await containerRes.text()
    throw new Error(t)
  }
  const containerJson = await containerRes.json()
  const containerId = containerJson.id as string | undefined
  if (!containerId) throw new Error("no_container")
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${post.account.platformAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: token,
      }),
    }
  )
  if (!publishRes.ok) {
    const t = await publishRes.text()
    throw new Error(t)
  }
  const publishJson = await publishRes.json()
  const id = publishJson.id as string | undefined
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "SUCCESS",
      publishedAt: new Date(),
      platformPostId: id ?? null,
      errorMessage: null,
    },
  })
}

async function publishToTikTok(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { account: true },
  })
  if (!post) return
  const token = decryptToken(post.account.encryptedAccessToken)
  const initRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/initialize/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "PULL_FROM_URL",
        video_url: post.mediaUrl,
        text: post.caption ?? "",
      }),
    }
  )
  if (!initRes.ok) {
    const t = await initRes.text()
    throw new Error(t)
  }
  const initJson = await initRes.json()
  const publishId =
    initJson.data?.publish_id ?? initJson.data?.video_id ?? null
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "SUCCESS",
      publishedAt: new Date(),
      platformPostId: publishId,
      errorMessage: null,
    },
  })
}
