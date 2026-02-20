import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const accounts = await prisma.account.findMany({
    where: { userId: (session.user as any).id as string },
    select: {
      id: true,
      platform: true,
      platformAccountId: true,
      platformAccountUsername: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(accounts)
}
