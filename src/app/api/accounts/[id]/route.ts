import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id: accountId } = await context.params
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  })
  if (!account) {
    return new NextResponse("Not found", { status: 404 })
  }
  await prisma.account.delete({ where: { id: accountId } })
  return NextResponse.json({ ok: true })
}
