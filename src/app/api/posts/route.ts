import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const caption = formData.get("caption")?.toString() ?? ""
  const scheduledAtStr = formData.get("scheduledAt")?.toString()
  const platformsStr = formData.get("platforms")?.toString()
  if (!file || !scheduledAtStr || !platformsStr) {
    return new NextResponse("Missing fields", { status: 400 })
  }
  const scheduledAt = new Date(scheduledAtStr)
  const platforms = JSON.parse(platformsStr) as any[]
  const form = new FormData()
  form.append("file", file)
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET)
  }
  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: form,
    }
  )
  if (!cloudRes.ok) {
    const text = await cloudRes.text()
    return new NextResponse(`Cloudinary upload failed: ${text}`, {
      status: 400,
    })
  }
  const cloudJson = await cloudRes.json()
  const mediaUrl = cloudJson.secure_url as string
  const accounts = await prisma.account.findMany({
    where: {
      userId: (session.user as any).id as string,
      platform: { in: platforms },
    },
  })
  if (accounts.length === 0) {
    return new NextResponse("No connected accounts for selected platforms", {
      status: 400,
    })
  }
  const data = accounts.map((account: any) => ({
    userId: (session.user as any).id as string,
    accountId: account.id,
    platform: account.platform,
    caption,
    mediaUrl,
    scheduledAt,
  }))
  await prisma.post.createMany({ data })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const url = new URL(req.url)
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  const where: any = { userId: (session.user as any).id as string }
  if (from && to) {
    where.scheduledAt = { gte: new Date(from), lte: new Date(to) }
  }
  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true,
      scheduledAt: true,
      platform: true,
      status: true,
    },
    orderBy: { scheduledAt: "asc" },
  })
  return NextResponse.json(posts)
}
